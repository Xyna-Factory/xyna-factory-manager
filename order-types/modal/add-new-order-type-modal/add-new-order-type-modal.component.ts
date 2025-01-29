/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2023 Xyna GmbH, Germany
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */
import { Component, Injector, ViewChild } from '@angular/core';

import { ApiService, RuntimeContext, StartOrderOptionsBuilder, XoRuntimeContext } from '@zeta/api';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XcAutocompleteDataWrapper, XcDialogComponent, XcFormDirective, XcRemoteTableDataSource, XcRichListItem, XcStringIntegerDataWrapper } from '@zeta/xc';

import { XoCapacityInformation, XoCapacityInformationArray } from '../../../capacities/xo/xo-capacity-information.model';
import { FM_RTC } from '../../../const';
import { FMFocusCandidateRef } from '../../../misc/directives/fm-focus-candidate.directive';
import { FactoryManagerSettingsService } from '../../../misc/services/factory-manager-settings.service';
import { XoDestinationTypeArray } from '../../../xo/xo-destination-type.model';
import { XoParameterInheritanceRule } from '../../../xo/xo-parameter-inheritance-rule.model';
import { ChildOrderInheritanceRuleComponent, ChildOrderInheritanceRuleComponentData } from '../../items/child-order-inheritance-rule/child-order-inheritance-rule.component';
import { XoCapacity, XoCapacityArray } from '../../xo/xo-capacity.model';
import { XoOrderTypeCapacitiesTableInfo } from '../../xo/xo-order-type-capacities-table-info.model';
import { XoOrderType } from '../../xo/xo-order-type.model';
import { addNewOrderTypeModal_translations_de_DE } from './locale/add-new-order-type-modal-translations.de-DE';
import { addNewOrderTypeModal_translations_en_US } from './locale/add-new-order-type-modal-translations.en-US';


export interface AddNewOrderTypeModalComponentData {
    addWorkflow: string;
    GetDestinationsWorkflow: string;
    GetOrdertypeCapacitiesWorkflow: string;
    rtc: RuntimeContext;
    i18nService: I18nService;
    duplicate: XoOrderType;
    UNSPECIFIED_GET_RUNTIME_CONTEXTS_ERROR: string;
    USE_DEFAULT: string;
}

@Component({
    templateUrl: './add-new-order-type-modal.component.html',
    styleUrls: ['./add-new-order-type-modal.component.scss'],
    standalone: false
})
export class AddNewOrderTypeModalComponent extends XcDialogComponent<boolean, AddNewOrderTypeModalComponentData> {

    @ViewChild(XcFormDirective, {static: false})
    xcFormDirective: XcFormDirective;

    get invalid(): boolean {
        return this.xcFormDirective ? this.xcFormDirective.invalid : true;
    }

    busy = false;
    private _error: string;
    get error(): string {
        return this._error;
    }
    set error(value: string) {
        this._error = value;
        if (value) {
            this.errorBoxFocusCandidateRef.focus();
        }
    }
    errorBoxFocusCandidateRef = FMFocusCandidateRef.getInstance();

    orderType: XoOrderType;

    //#region - ########################################################### RUNTIME CONTEXT
    runtimeContextsDataWrapper: XcAutocompleteDataWrapper;

    private _selectedServerRuntimeContext: XoRuntimeContext;
    get selectedServerRuntimeContext(): XoRuntimeContext {
        if (this.orderType && this.orderType.runtimeContext) {
            return this.orderType.runtimeContext;
        }
        return this._selectedServerRuntimeContext;
    }
    set selectedServerRuntimeContext(value: XoRuntimeContext) {
        this._selectedServerRuntimeContext = value;
        if (this.orderType) {
            this.orderType.runtimeContext = value;
            // this.orderType.revision = value ? value.revision : null;
            // this.orderType.workspace = (value instanceof XoWorkspace) ? value.name : null;
            // this.orderType.application = (value instanceof XoApplication) ? value.name : null;
            // this.orderType.version = (value instanceof XoApplication) ? value.versionName : null;
            this._getDestinations();
        }
    }
    //#endregion - ########################################################### RUNTIME CONTEXT

    planningDestinationDataWrapper: XcAutocompleteDataWrapper;
    get defaultPlanningDestination() {
        return this.orderType ? !this.orderType.planningDestinationIsCustom : true;
    }
    set defaultPlanningDestination(value) {
        if (this.orderType) {
            this.orderType.planningDestinationIsCustom = !value;
        }
    }

    executionDestinationDataWrapper: XcAutocompleteDataWrapper;
    monitoringLevelDataWrapper: XcAutocompleteDataWrapper;

    get precedence(): number {
        return this.orderType ? this.orderType.precedence : null;
    }
    set precedence(value: number) {
        if (this.orderType) {
            this.orderType.precedence = value;
        }
    }
    precedenceDataWrapper = new XcStringIntegerDataWrapper(
        () => this.precedence,
        (value: number) => this.precedence = value
    );

    priorityDataWrapper = new XcStringIntegerDataWrapper(
        () => this.orderType ? this.orderType.priority : 0,
        (value: number) => this.orderType ? this.orderType.priority = value : null
    );
    get defaultPriority() {
        return this.orderType ? !this.orderType.priorityIsCustom : false;
    }
    set defaultPriority(value) {
        if (this.orderType) {
            this.orderType.priorityIsCustom = !value;
        }
    }

    childOrderInheritanceRulesFilter: string;
    childOrderInheritanceRulesMonitoringLevel = '20';
    childOrderInheritanceRulesMonitoringLevelDataWrapper: XcAutocompleteDataWrapper;

    childOrderInheritanceRulesPrecedence: number;
    childOrderInheritanceRulesPrecedenceDataWrapper = new XcStringIntegerDataWrapper(
        () => this.childOrderInheritanceRulesPrecedence,
        (value: number) => this.childOrderInheritanceRulesPrecedence = value
    );

    childOrderInheritanceRulesItems: XcRichListItem<ChildOrderInheritanceRuleComponentData>[] = [];

    dsOrderTypeCapacitiesDataSource: XcRemoteTableDataSource<XoCapacityInformation>;

    constructor(injector: Injector, private readonly i18n: I18nService, private readonly apiService: ApiService, private readonly settings: FactoryManagerSettingsService) {
        super(injector);

        this.i18n.setTranslations(LocaleService.DE_DE, addNewOrderTypeModal_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, addNewOrderTypeModal_translations_en_US);

        if (this.injectedData.duplicate) {
            this._useDuplicate(this.injectedData.duplicate.clone());
        } else {
            this.orderType = new XoOrderType();
            this.orderType.monitoringLevel = '-1';
            this.orderType.monitoringLevelIsCustom = true;
        }

        this.runtimeContextsDataWrapper = new XcAutocompleteDataWrapper(
            () => this.selectedServerRuntimeContext,
            (value: XoRuntimeContext) => this.selectedServerRuntimeContext = value
        );

        this._getRuntimeContexts();

        this.planningDestinationDataWrapper = new XcAutocompleteDataWrapper(
            () => this.orderType ? this.orderType.planningDestination : null,
            value => this.orderType ? this.orderType.planningDestination = value : null
        );

        this.executionDestinationDataWrapper = new XcAutocompleteDataWrapper(
            () => this.orderType ? this.orderType.executionDestination : null,
            value => this.orderType ? this.orderType.executionDestination = value : null
        );

        this.monitoringLevelDataWrapper = new XcAutocompleteDataWrapper(
            () => this.orderType.monitoringLevel,
            (value: string) => this.orderType.monitoringLevel = value,
            [
                {name: this.injectedData.USE_DEFAULT, value: '-1'},
                {name: '0', value: '0'},
                {name: '5', value: '5'},
                {name: '10', value: '10'},
                {name: '15', value: '15'},
                {name: '17', value: '17'},
                {name: '18', value: '18'},
                {name: '20', value: '20'}
            ]
        );

        this.childOrderInheritanceRulesMonitoringLevelDataWrapper = new XcAutocompleteDataWrapper(
            () => this.childOrderInheritanceRulesMonitoringLevel,
            (value: string) => this.childOrderInheritanceRulesMonitoringLevel = value,
            this.monitoringLevelDataWrapper.values
        );

        this._init();
    }

    private _init() {
        this._getDestinations();
        //#region - TODO - this logic may belong to the server ?!
        // defaultPlanningDestination = !OrderType.planningDestinationIsCustom
        if (!this.orderType.planningDestination || !this.orderType.planningDestination.name) {
            this.defaultPlanningDestination = true;
        }
        if (this.orderType.planningDestination && this.orderType.planningDestination.name === 'DefaultPlanning') {
            this.defaultPlanningDestination = true;
        }
        //#endregion

        this.monitoringLevelDataWrapper.update();
        this.updateChildOrderInheritanceRules();
        // default values;
        this.childOrderInheritanceRulesMonitoringLevel = '20';
        this.childOrderInheritanceRulesFilter = '*';
        this.childOrderInheritanceRulesPrecedence = 0;

        this.dsOrderTypeCapacitiesDataSource = new XcRemoteTableDataSource<XoCapacityInformation>(
            this.apiService,
            this.injectedData.i18nService,
            FM_RTC,
            this.injectedData.GetOrdertypeCapacitiesWorkflow,
            XoOrderTypeCapacitiesTableInfo
        );

        this.dsOrderTypeCapacitiesDataSource.output = XoCapacityInformationArray;
        this.dsOrderTypeCapacitiesDataSource.refreshOnFilterChange = this.settings.tableRefreshOnFilterChange;
        this.dsOrderTypeCapacitiesDataSource.error.subscribe(result => {
            console.error('Error happened while retrieving the table data', result);
        });
        // this.dsOrderTypeCapacitiesDataSource.refresh();

        this.dsOrderTypeCapacitiesDataSource.dataChange.subscribe(() =>
            this.readUsageOfRequiredCapacitiesFromDetailsObjectAndAddToDetailsPanelCapacity()
        );

        this.readOrderTypeCapacitiesFromDetailsObject();

    }

    private _getRuntimeContexts() {

        this.apiService.getRuntimeContexts(false).subscribe(
            rtcArr => {
                if (rtcArr && rtcArr.length) {
                    this.runtimeContextsDataWrapper.values = rtcArr.map(rtc => ({value: rtc, name: rtc.toString()}));
                    this.error = '';
                } else {
                    this.error = this.injectedData.UNSPECIFIED_GET_RUNTIME_CONTEXTS_ERROR;
                }
            }, error => this.error = error
        );
    }

    private _getDestinations() {

        if (!this.selectedServerRuntimeContext) {
            console.warn('could not get destinations for the object of this runtimecontext: ', this.selectedServerRuntimeContext);
            return;
        }

        const obs = this.apiService.startOrder(
            FM_RTC, this.injectedData.GetDestinationsWorkflow,
            [this.selectedServerRuntimeContext],
            XoDestinationTypeArray,
            StartOrderOptionsBuilder.defaultOptionsWithErrorMessage
        );
        obs.subscribe(
            result => {
                if (result && !result.errorMessage) {
                    const dtArr = (result.output[0] || { data: []}) as XoDestinationTypeArray;
                    this.planningDestinationDataWrapper.values = dtArr.data.map(dt => ({name: dt.name, value: dt}));
                    this.executionDestinationDataWrapper.values = dtArr.data.map(dt => ({name: dt.name, value: dt}));
                } else {
                    // console.log('_getDestinations\' result error: ', result);
                }
            }, error => console.log('_getDestinations error: ', error)
        );
    }

    addChildOrderInheritanceRule() {

        const rule = new XoParameterInheritanceRule();
        rule.filter = this.childOrderInheritanceRulesFilter;
        rule.precedence = this.childOrderInheritanceRulesPrecedence;
        rule.value = this.childOrderInheritanceRulesMonitoringLevel;

        this.childOrderInheritanceRulesItems.push({
            component: ChildOrderInheritanceRuleComponent,
            data: {
                rule: rule
            }

        });
    }

    private updateChildOrderInheritanceRules() {
        this.childOrderInheritanceRulesItems = [];

        if (this.orderType && this.orderType.parameterInheritanceRules) {
            this.orderType.parameterInheritanceRules.data.forEach(
                rule => {
                    this.childOrderInheritanceRulesItems.push({
                        component: ChildOrderInheritanceRuleComponent,
                        data: {
                            rule: rule
                        }
                    });
                }
            );
        }
    }

    private readOrderTypeCapacitiesFromDetailsObject() {
        XoCapacityInformation.requiredUniqueKeysAddModal.clear();
        if (this.orderType) {
            this.orderType.requiredCapacities.data.forEach(
                cap => {
                    const capi = new XoCapacityInformation();
                    capi.name = cap.name;
                    capi.inuse = cap.cardinality;
                    XoCapacityInformation.requiredUniqueKeysAddModal.set(cap.uniqueKey, capi);
                }
            );
        }
    }

    private writeOrderTypeCapacitiesToDetailsObject() {
        const capArr = new XoCapacityArray();
        XoCapacityInformation.requiredUniqueKeysAddModal.forEach(capi => {
            const cap = new XoCapacity();
            cap.name = capi.name;
            cap.cardinality = capi.inuse;
            capArr.data.push(cap);
        });
        this.orderType.requiredCapacities = capArr;
    }

    private readUsageOfRequiredCapacitiesFromDetailsObjectAndAddToDetailsPanelCapacity() {

        if (this.dsOrderTypeCapacitiesDataSource && this.dsOrderTypeCapacitiesDataSource.rows) {

            const nameUsageMap = new Map<string, number>();
            this.orderType.requiredCapacities.data.forEach(rc => {
                // cardinality is the usage of the Capacities in the detail panel of the selected order type
                nameUsageMap.set(rc.name, rc.cardinality);
            });

            this.dsOrderTypeCapacitiesDataSource.rows.forEach(cap => {
                cap.usage = nameUsageMap.get(cap.name) || 0;
            });

        }
    }

    private writeUsageOfRequiredCapacitiesToDetailsObjectFromDetailsPanelCapacity() {

        if (this.dsOrderTypeCapacitiesDataSource && this.dsOrderTypeCapacitiesDataSource.rows) {

            const nameUsageMap = new Map<string, number>();

            this.dsOrderTypeCapacitiesDataSource.rows.forEach(cap => {
                nameUsageMap.set(cap.name, cap.usage);
            });

            this.orderType.requiredCapacities.data.forEach(rc => {
                // cardinality is the usage of the Capacities in the detail panel of the selected order type
                rc.cardinality = nameUsageMap.get(rc.name);
            });

        }
    }

    refreshOrderTypeCapacitiesDataSource() {
        this.dsOrderTypeCapacitiesDataSource.refresh();
    }

    private _useDuplicate(ot: XoOrderType) {
        this.orderType = ot;
    }


    add() {

        if (!this.orderType.priorityIsCustom) {
            delete this.orderType.priority;
        }

        this.writeOrderTypeCapacitiesToDetailsObject();
        this.writeUsageOfRequiredCapacitiesToDetailsObjectFromDetailsPanelCapacity();

        // make sure that there are no rules in the order type
        this.orderType.parameterInheritanceRules.data.splice(0, this.orderType.parameterInheritanceRules.data.length);
        // save all rules in the ordertype, which will be send to the server
        let item: XcRichListItem<ChildOrderInheritanceRuleComponentData>;
        for (item of this.childOrderInheritanceRulesItems) {
            this.orderType.parameterInheritanceRules.data.push(item.data.rule);
        }

        this.busy = true;
        this.apiService.startOrder(this.injectedData.rtc, this.injectedData.addWorkflow, [this.orderType], null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).subscribe(
            result => {
                if (result && result.errorMessage) {
                    this.error = this.injectedData.i18nService.translateErrorCode(result.errorMessage);
                } else {
                    this.dismiss(true);
                }
            },
            error => console.log('Add error: ', error),
            () => this.busy = false
        );
    }

}

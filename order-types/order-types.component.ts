/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2024 Xyna GmbH, Germany
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
import { Component, Injector, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { XmomObjectType } from '@pmod/api/xmom-types';
import { XoRuntimeContext } from '@pmod/xo/runtime-context.model';
import { ApiService, FullQualifiedName, StartOrderOptionsBuilder } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { QueryParameterService } from '@zeta/nav/query-parameter.service';
import { XcAutocompleteDataWrapper, XcDialogService, XcFormDirective, XcRemoteTableDataSource, XcRichListItem, XcStringIntegerDataWrapper } from '@zeta/xc';

import { Subscription } from 'rxjs';

import { XoCapacityInformation, XoCapacityInformationArray } from '../capacities/xo/xo-capacity-information.model';
import { FM_RTC, PROCESS_MODELLER_TAB_URL } from '../const';
import { FactoryManagerSettingsService } from '../misc/services/factory-manager-settings.service';
import { XoDestinationTypeArray } from '../xo/xo-destination-type.model';
import { XoParameterInheritanceRule } from '../xo/xo-parameter-inheritance-rule.model';
import { ChildOrderInheritanceRuleComponent, ChildOrderInheritanceRuleComponentData } from './items/child-order-inheritance-rule/child-order-inheritance-rule.component';
import { AddNewOrderTypeModalComponent, AddNewOrderTypeModalComponentData } from './modal/add-new-order-type-modal/add-new-order-type-modal.component';
import { ORDER_TYPE_ISWP, RestorableOrderTypesComponent } from './restorable-order-types.component';
import { XoCapacity, XoCapacityArray } from './xo/xo-capacity.model';
import { XoExecutionDestinationFilter } from './xo/xo-execution-destination-filter.model';
import { XoOrderTypeCapacitiesTableInfo } from './xo/xo-order-type-capacities-table-info.model';
import { XoOrderTypeName } from './xo/xo-order-type-name.model';
import { XoOrderTypeTableFilter } from './xo/xo-order-type-table-filter.model';
import { XoOrderType, XoOrderTypeArray } from './xo/xo-order-type.model';


export const EXECUTION_DESTINATION_DOCUMENT_TYPE = 'workflow';

// FIXME: build from constants in factory-manager.routing
export const ORDER_TYPES_URL = '/xfm/Factory-Manager/ordertypes';

const ISWP = ORDER_TYPE_ISWP;

@Component({
    templateUrl: './order-types.component.html',
    styleUrls: ['./order-types.component.scss'],
    standalone: false
})
export class OrderTypesComponent extends RestorableOrderTypesComponent implements OnDestroy {

    private readonly queryParamService: QueryParameterService;

    @ViewChild(XcFormDirective, { static: false })
    xcFormDirective: XcFormDirective;

    get invalid(): boolean {
        return this.xcFormDirective ? this.xcFormDirective.invalid : false;
    }


    get runtimeContextString(): string {
        return this.detailsObject.runtimeContext.toString();
    }


    planningDestinationDataWrapper: XcAutocompleteDataWrapper;
    get defaultPlanningDestination() {
        return this.detailsObject ? !this.detailsObject.planningDestinationIsCustom : true;
    }
    set defaultPlanningDestination(value) {
        if (this.detailsObject) {
            this.detailsObject.planningDestinationIsCustom = !value;
        }
    }

    executionDestinationDataWrapper: XcAutocompleteDataWrapper;
    monitoringLevelDataWrapper: XcAutocompleteDataWrapper;

    get precedence(): number {
        return this.detailsObject ? this.detailsObject.precedence : null;
    }
    set precedence(value: number) {
        if (this.detailsObject) {
            this.detailsObject.precedence = value;
        }
    }
    precedenceDataWrapper = new XcStringIntegerDataWrapper(
        () => this.precedence,
        (value: number) => this.precedence = value
    );

    priorityDataWrapper = new XcStringIntegerDataWrapper(
        () => this.detailsObject ? this.detailsObject.priority : 0,
        (value: number) => this.detailsObject ? this.detailsObject.priority = value : null
    );

    get defaultPriority() {
        return this.detailsObject ? !this.detailsObject.priorityIsCustom : false;
    }
    set defaultPriority(value) {
        if (this.detailsObject) {
            this.detailsObject.priorityIsCustom = !value;
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

    private readonly tableInfoChangeSubscription: Subscription;

    orderTypeTableFilter = new XoOrderTypeTableFilter();

    constructor(
        apiService: ApiService,
        dialogService: XcDialogService,
        route: ActivatedRoute,
        router: Router,
        i18nService: I18nService,
        settings: FactoryManagerSettingsService,
        injector: Injector
    ) {
        super(apiService, dialogService, route, router, i18nService, injector, settings);

        this.orderTypeTableFilter.showPath = false;

        this.initRemoteTableDataSource(XoOrderType, XoOrderTypeArray, FM_RTC, ISWP.List, [new XoExecutionDestinationFilter(), this.orderTypeTableFilter]);

        this.tableInfoChangeSubscription = this.remoteTableDataSource.tableInfoChange.subscribe(() => {
            // reset overriding execution destination filter that might have been set via jumping from workflow in PMOD to order type overview
            console.log('tableInfoChange');
            this.remoteTableDataSource.input = [ new XoExecutionDestinationFilter(), this.orderTypeTableFilter ];
        });

        this.selectedEntryChange.subscribe(
            selection => {
                if (selection && selection.length) {
                    this.getDetails(selection[0]);
                }
            }
        );

        this.remoteTableDataSource.actionElements = [
            {
                class: 'delete-action-element',
                iconName: 'delete',
                tooltip: this.i18nService.translate('fman.order-types.delete'),
                onAction: this.delete.bind(this)
            },
            {
                class: 'copy-action-element',
                iconName: 'copy',
                tooltip: this.i18nService.translate('fman.order-types.duplicate'),
                onAction: this.duplicate.bind(this)
            }
        ];

        this.planningDestinationDataWrapper = new XcAutocompleteDataWrapper(
            () => this.detailsObject ? this.detailsObject.planningDestination : null,
            value => this.detailsObject ? this.detailsObject.planningDestination = value : null
        );

        this.executionDestinationDataWrapper = new XcAutocompleteDataWrapper(
            () => this.detailsObject ? this.detailsObject.executionDestination : null,
            value => this.detailsObject ? this.detailsObject.executionDestination = value : null
        );

        this.monitoringLevelDataWrapper = new XcAutocompleteDataWrapper(
            () => this.detailsObject ? this.detailsObject.monitoringLevel : null,
            (value: string) => {
                if (this.detailsObject) {
                    this.detailsObject.monitoringLevel = value;
                }
            },
            [
                { name: this.i18nService.translate(this.USE_DEFAULT), value: '-1' },
                { name: '0', value: '0' },
                { name: '5', value: '5' },
                { name: '10', value: '10' },
                { name: '15', value: '15' },
                { name: '17', value: '17' },
                { name: '18', value: '18' },
                { name: '20', value: '20' }
            ]
        );

        this.childOrderInheritanceRulesMonitoringLevelDataWrapper = new XcAutocompleteDataWrapper(
            () => this.childOrderInheritanceRulesMonitoringLevel,
            (value: string) => this.childOrderInheritanceRulesMonitoringLevel = value,
            this.monitoringLevelDataWrapper.values
        );

        // filter with query params that are set when jumping from workflow in PMOD to order type overview
        route.queryParams.subscribe(queryParams => {
            if (!queryParams.executionDestinationFilter) {
                console.log('queryParams.executionDestinationFilter === undefined -> nothing to do');
                return;
            }

            console.log('QueryParams: ' + JSON.stringify(queryParams));
            const filterValues = JSON.parse(decodeURI(queryParams.executionDestinationFilter)) as {rtc: string; fqn: string; type: XmomObjectType};
            const rtc = XoRuntimeContext.fromQueryParam(filterValues.rtc).runtimeContext();
            const fqn = FullQualifiedName.decode(filterValues.fqn);

            const executionDestinationFilter: XoExecutionDestinationFilter = new XoExecutionDestinationFilter();
            executionDestinationFilter.executionDestination = fqn.path + '.' + fqn.name;
            if (rtc.av) {
                executionDestinationFilter.application = rtc.av.application;
                executionDestinationFilter.version = rtc.av.version;
            } else if (rtc.ws) {
                executionDestinationFilter.workspace = rtc.ws.workspace;
            }

            console.log('executionDestinationFilter.application: ' + executionDestinationFilter.application);
            console.log('executionDestinationFilter.version: ' + executionDestinationFilter.version);
            console.log('executionDestinationFilter.workspace: ' + executionDestinationFilter.workspace);
            console.log('executionDestinationFilter.executionDestination: ' + executionDestinationFilter.executionDestination);

            this.remoteTableDataSource.input = [ executionDestinationFilter ];
            this.refresh();

            void this.router.navigateByUrl(ORDER_TYPES_URL);
        });
    }

    ngOnDestroy() {
        this.tableInfoChangeSubscription?.unsubscribe();
    }

    private _getDestinations() {

        if (!this.detailsObject || !this.detailsObject.runtimeContext) {
            console.warn('could not get destinations for the detail object', this.detailsObject);
            return;
        }

        const obs = this.apiService.startOrder(FM_RTC, ISWP.GetDestinations, [this.detailsObject.runtimeContext], XoDestinationTypeArray, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
        this.handleStartOrderResult(obs, (output: any[]) => {
            const dtArr = (output[0] || { data: [] }) as XoDestinationTypeArray;

            this.planningDestinationDataWrapper.values = dtArr.data.map(dt => ({ name: dt.name, value: dt }));
            this.executionDestinationDataWrapper.values = dtArr.data.map(dt => ({ name: dt.name, value: dt }));
        }, 'error! ask admin!');

    }

    private getDetails(entry: XoOrderType) {

        const name = new XoOrderTypeName();
        name.name = entry.fullQualifiedName;

        const obs = this.apiService.startOrder(FM_RTC, ISWP.Details, [entry.runtimeContext, name], XoOrderType, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
        this.handleStartOrderResult(obs, output => {

            this.detailsObject = (output[0] || null) as XoOrderType;
            if (this.detailsObject.monitoringLevel) {
                const negativnumber = new RegExp('^-\\d+$');
                if (negativnumber.test(this.detailsObject.monitoringLevel)) {
                    this.detailsObject.monitoringLevel = '-1';
                } else if (!this.monitoringLevelDataWrapper.values.find(item => item.value === this.detailsObject.monitoringLevel)) {
                    this.monitoringLevelDataWrapper.values.push({name: this.detailsObject.monitoringLevel, value: this.detailsObject.monitoringLevel});
                }
            } else {
                this.detailsObject.monitoringLevel = '-1';
            }
            this._getDestinations();

            // #region - TODO - this logic may belong to the server ?!
            // defaultPlanningDestination = !OrderType.planningDestinationIsCustom
            if (!this.detailsObject.planningDestination || !this.detailsObject.planningDestination.name) {
                this.defaultPlanningDestination = true;
            }
            if (this.detailsObject.planningDestination && this.detailsObject.planningDestination.name === 'DefaultPlanning') {
                this.defaultPlanningDestination = true;
            }
            // #endregion

            this.monitoringLevelDataWrapper.update();
            this.updateChildOrderInheritanceRules();
            // default values;
            this.childOrderInheritanceRulesFilter = '*';
            this.childOrderInheritanceRulesPrecedence = 0;

            this.dsOrderTypeCapacitiesDataSource = new XcRemoteTableDataSource<XoCapacityInformation>(
                this.apiService, this.i18nService, this.rtc, ISWP.GetOrdertypeCapacities, XoOrderTypeCapacitiesTableInfo
            );

            this.dsOrderTypeCapacitiesDataSource.output = XoCapacityInformationArray;
            this.dsOrderTypeCapacitiesDataSource.refreshOnFilterChange = this.settings.tableRefreshOnFilterChange;
            this.dsOrderTypeCapacitiesDataSource.error.subscribe(result => {
                console.error('Error happened while retrieving the table data', result);
            });

            this.dsOrderTypeCapacitiesDataSource.dataChange.subscribe(
                () => this.readUsageOfRequiredCapacitiesFromDetailsObjectAndAddToDetailsPanelCapacity()
            );
            this.dsOrderTypeCapacitiesDataSource.refresh();

            this.readOrderTypeCapacitiesFromDetailsObject();


        }, this.UNSPECIFIED_DETAILS_ERROR, null);
    }

    add(duplicated: XoOrderType = null) {

        const data: AddNewOrderTypeModalComponentData = {
            addWorkflow: ISWP.Add,
            GetDestinationsWorkflow: ISWP.GetDestinations,
            GetOrdertypeCapacitiesWorkflow: ISWP.GetOrdertypeCapacities,
            i18nService: this.i18nService,
            rtc: FM_RTC,
            duplicate: duplicated,
            UNSPECIFIED_GET_RUNTIME_CONTEXTS_ERROR: this.UNSPECIFIED_GET_RUNTIME_CONTEXTS_ERROR,
            USE_DEFAULT: this.USE_DEFAULT
        };

        XoCapacityInformation.isInModalFlag = true;
        XoCapacityInformation.requiredUniqueKeysAddModal.clear();

        this.dialogService.custom<boolean, AddNewOrderTypeModalComponentData>(AddNewOrderTypeModalComponent, data).afterDismissResult()
            .subscribe(
                result => {
                    if (result) {
                        this.refresh();
                    }
                }, error => console.log('AddNewOrderTypeModalComponent error = ', error),
                () => XoCapacityInformation.isInModalFlag = false
            );

        // this.dialogService.error('not implemented yet');
    }

    duplicate(entry: XoOrderType) {

        const name = new XoOrderTypeName();
        name.name = entry.fullQualifiedName;

        const obs = this.apiService.startOrder(FM_RTC, ISWP.Details, [entry.runtimeContext, name], XoOrderType, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
        this.handleStartOrderResult(obs, output => {

            const dub = (output[0] || null) as XoOrderType;
            this.add(dub);

        }, this.UNSPECIFIED_DETAILS_ERROR);

    }

    delete(entry: XoOrderType) {

        this.dialogService.confirm(
            this.i18nService.translate(this.FM_DELETE_ENTRY_HEADER),
            this.i18nService.translate(this.CONFIRM_DELETE, { key: '$0', value: entry.fullQualifiedName })
        ).afterDismissResult().subscribe(
            value => {
                if (value) {
                    if (entry instanceof XoOrderType) {
                        const name = new XoOrderTypeName();
                        name.name = entry.fullQualifiedName;
                        const obs = this.apiService.startOrder(FM_RTC, ISWP.Delete, [entry.runtimeContext, name], null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
                        this.handleStartOrderResult(obs, () => {
                            this.detailsObject = null;
                            this.clearSelection();
                        }, this.UNSPECIFIED_DETAILS_ERROR, () => this.refresh());
                    }
                }
            }
        );
    }

    dismiss() {
        this.detailsObject = null;
        this.clearSelection();
    }

    save() {

        if (!this.detailsObject.priorityIsCustom) {
            delete this.detailsObject.priority;
        }

        this.writeOrderTypeCapacitiesToDetailsObject();
        this.writeUsageOfRequiredCapacitiesToDetailsObjectFromDetailsPanelCapacity();

        // make sure that there are no rules in the order type
        this.detailsObject.parameterInheritanceRules.data.splice(0, this.detailsObject.parameterInheritanceRules.data.length);
        // save all rules in the ordertype, which will be sent to the server
        let item: XcRichListItem<ChildOrderInheritanceRuleComponentData>;
        for (item of this.childOrderInheritanceRulesItems) {
            this.detailsObject.parameterInheritanceRules.data.push(item.data.rule);
        }

        const obs = this.apiService.startOrder(FM_RTC, ISWP.Save, this.detailsObject.clone(), null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
        this.handleStartOrderResult(obs, () => {
            this.dismiss();
            this.refresh();
        }, this.UNSPECIFIED_SAVE_ERROR);
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

        if (this.detailsObject && this.detailsObject.parameterInheritanceRules) {
            this.detailsObject.parameterInheritanceRules.data.forEach(
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
        XoCapacityInformation.requiredUniqueKeys.clear();
        if (this.detailsObject) {
            this.detailsObject.requiredCapacities.data.forEach(
                cap => {
                    const capi = new XoCapacityInformation();
                    capi.name = cap.name;
                    capi.inuse = cap.cardinality;
                    XoCapacityInformation.requiredUniqueKeys.set(cap.uniqueKey, capi);
                }
            );
        }
    }

    private writeOrderTypeCapacitiesToDetailsObject() {
        const capArr = new XoCapacityArray();
        XoCapacityInformation.requiredUniqueKeys.forEach(capi => {
            const cap = new XoCapacity();
            cap.name = capi.name;
            cap.cardinality = capi.inuse;
            capArr.data.push(cap);
        });
        this.detailsObject.requiredCapacities = capArr;
    }

    private readUsageOfRequiredCapacitiesFromDetailsObjectAndAddToDetailsPanelCapacity() {

        if (this.dsOrderTypeCapacitiesDataSource && this.dsOrderTypeCapacitiesDataSource.rows) {

            const nameUsageMap = new Map<string, number>();
            this.detailsObject.requiredCapacities.data.forEach(rc => {
                // cardinality is the usage of the Capacities in the detail panel of the selected order type
                nameUsageMap.set(rc.name, rc.cardinality);
            });

            this.dsOrderTypeCapacitiesDataSource.rows.forEach(cap => {
                cap.usage = nameUsageMap.get(cap.name) || 1;
            });

        }
    }

    private writeUsageOfRequiredCapacitiesToDetailsObjectFromDetailsPanelCapacity() {

        if (this.dsOrderTypeCapacitiesDataSource && this.dsOrderTypeCapacitiesDataSource.rows) {

            const nameUsageMap = new Map<string, number>();

            this.detailsObject.requiredCapacities.data.forEach(rc => {
                nameUsageMap.set(rc.name, rc.cardinality);
            });

            this.dsOrderTypeCapacitiesDataSource.rows.forEach(cap => {
                nameUsageMap.set(cap.name, cap.usage);
            });

            this.detailsObject.requiredCapacities.data.forEach(rc => {
                // cardinality is the usage of the Capacities in the detail panel of the selected order type
                rc.cardinality = nameUsageMap.get(rc.name);
            });
        }
    }

    refreshOrderTypeCapacitiesDataSource() {

        const name = new XoOrderTypeName();
        name.name = this.detailsObject.fullQualifiedName;

        const obs = this.apiService.startOrder(FM_RTC, ISWP.Details, [this.detailsObject.runtimeContext, name], XoOrderType, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
        this.handleStartOrderResult(obs, output => {

            this.detailsObject = (output[0] || null) as XoOrderType;

            this.dsOrderTypeCapacitiesDataSource = new XcRemoteTableDataSource<XoCapacityInformation>(
                this.apiService, this.i18nService, this.rtc, ISWP.GetOrdertypeCapacities, XoOrderTypeCapacitiesTableInfo
            );

            this.dsOrderTypeCapacitiesDataSource.output = XoCapacityInformationArray;
            this.dsOrderTypeCapacitiesDataSource.refreshOnFilterChange = this.settings.tableRefreshOnFilterChange;
            this.dsOrderTypeCapacitiesDataSource.error.subscribe(result => {
                console.error('Error happened while retrieving the table data', result);
            });

            this.dsOrderTypeCapacitiesDataSource.dataChange.subscribe(
                () => this.readUsageOfRequiredCapacitiesFromDetailsObjectAndAddToDetailsPanelCapacity()
            );
            this.dsOrderTypeCapacitiesDataSource.refresh();
            this.readOrderTypeCapacitiesFromDetailsObject();
        }, this.UNSPECIFIED_DETAILS_ERROR, null);
    }

    openExecutionDestination() {
        if (this.executionDestinationDataWrapper.value == null) {
            return;
        }

        const url = PROCESS_MODELLER_TAB_URL + QueryParameterService.createQueryValue(this.detailsObject.runtimeContext.toRuntimeContext().uniqueKey, this.executionDestinationDataWrapper.value.name, EXECUTION_DESTINATION_DOCUMENT_TYPE);
        void this.router.navigateByUrl(url);
    }

    showPaths() {
        this.orderTypeTableFilter.showPath = !this.orderTypeTableFilter.showPath;
        this.remoteTableDataSource.refresh();
    }

}

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
import { Subscription } from 'rxjs';

import { ChangeDetectionStrategy, Component, OnDestroy, signal, ViewChild } from '@angular/core';
import { FMAN_RTC } from '@fman/factory-manager.component';
import { XmomObjectType } from '@pmod/api/xmom-types';
import { XoRuntimeContext } from '@pmod/xo/runtime-context.model';
import { FullQualifiedName, StartOrderOptionsBuilder } from '@zeta/api';
import { XcI18nContextDirective, XcI18nPipe, XcI18nTranslateDirective } from '@zeta/i18n';
import { QueryParameterService } from '@zeta/nav/query-parameter.service';
import { XcAutocompleteDataWrapper, XcButtonComponent, XcCheckboxComponent, XcFormAutocompleteComponent, XcFormDirective, XcFormInputComponent, XcFormTextareaComponent, XcFormValidatorMaxValueDirective, XcFormValidatorMinValueDirective, XcFormValidatorNumberDirective, XcFormValidatorRequiredDirective, XcIconButtonComponent, XcMasterDetailComponent, XcPanelComponent, XcRemoteTableDataSource, XcRichListComponent, XcRichListItem, XcStringIntegerDataWrapper, XcTableComponent, XcTooltipDirective } from '@zeta/xc';

import { XoCapacityInformation, XoCapacityInformationArray } from '../capacities/xo/xo-capacity-information.model';
import { PROCESS_MODELLER_TAB_URL } from '../const';
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
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [XcButtonComponent, XcCheckboxComponent, XcFormAutocompleteComponent, XcFormDirective, XcFormInputComponent, XcFormTextareaComponent, XcFormValidatorMaxValueDirective, XcFormValidatorMinValueDirective, XcFormValidatorNumberDirective, XcFormValidatorRequiredDirective, XcIconButtonComponent, XcMasterDetailComponent, XcPanelComponent, XcRichListComponent, XcTableComponent, XcTooltipDirective, XcI18nContextDirective, XcI18nTranslateDirective, XcI18nPipe]
})
export class OrderTypesComponent extends RestorableOrderTypesComponent implements OnDestroy {

    @ViewChild(XcFormDirective, { static: false })
    xcFormDirective: XcFormDirective;

    readonly selectedDetails = signal<XoOrderType | null>(null);

    get invalid(): boolean {
        return this.xcFormDirective ? this.xcFormDirective.invalid : false;
    }


    get runtimeContextString(): string {
        return this.selectedDetails()?.runtimeContext.toString() || '';
    }


    planningDestinationDataWrapper: XcAutocompleteDataWrapper;
    get defaultPlanningDestination() {
        const details = this.selectedDetails();
        return details ? !details.planningDestinationIsCustom : true;
    }
    set defaultPlanningDestination(value) {
        const details = this.selectedDetails();
        if (details) {
            details.planningDestinationIsCustom = !value;
        }
    }

    executionDestinationDataWrapper: XcAutocompleteDataWrapper;
    monitoringLevelDataWrapper: XcAutocompleteDataWrapper;

    get precedence(): number {
        const details = this.selectedDetails();
        return details ? details.precedence : null;
    }
    set precedence(value: number) {
        const details = this.selectedDetails();
        if (details) {
            details.precedence = value;
        }
    }
    precedenceDataWrapper = new XcStringIntegerDataWrapper(
        () => this.precedence,
        (value: number) => this.precedence = value
    );

    priorityDataWrapper = new XcStringIntegerDataWrapper(
        () => {
            const details = this.selectedDetails();
            return details ? details.priority : 0;
        },
        (value: number) => {
            const details = this.selectedDetails();
            if (details) {
                details.priority = value;
            }
        }
    );

    get defaultPriority() {
        const details = this.selectedDetails();
        return details ? !details.priorityIsCustom : false;
    }
    set defaultPriority(value) {
        const details = this.selectedDetails();
        if (details) {
            details.priorityIsCustom = !value;
        }
    }

    get documentation(): string {
        return this.selectedDetails()?.documentation;
    }
    set documentation(value: string) {
        const details = this.selectedDetails();
        if (details) {
            details.documentation = value;
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

    constructor() {
        super();

        this.orderTypeTableFilter.showPath = false;

        this.initRemoteTableDataSource(XoOrderType, XoOrderTypeArray, FMAN_RTC, ISWP.List, [new XoExecutionDestinationFilter(), this.orderTypeTableFilter]);

        this.tableInfoChangeSubscription = this.remoteTableDataSource.tableInfoChange.subscribe(() => {
            // reset overriding execution destination filter that might have been set via jumping from workflow in PMOD to order type overview
            // console.log('tableInfoChange');
            this.remoteTableDataSource.input = [new XoExecutionDestinationFilter(), this.orderTypeTableFilter];
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
                tooltip: this.i18nService.translateSignal('fman.order-types.delete'),
                onAction: this.delete.bind(this)
            },
            {
                class: 'copy-action-element',
                iconName: 'copy',
                tooltip: this.i18nService.translateSignal('fman.order-types.duplicate'),
                onAction: this.duplicate.bind(this)
            }
        ];

        this.planningDestinationDataWrapper = new XcAutocompleteDataWrapper(
            () => {
                const details = this.selectedDetails();
                return details ? details.planningDestination : null;
            },
            value => {
                const details = this.selectedDetails();
                if (details) {
                    details.planningDestination = value;
                }
            }
        );

        this.executionDestinationDataWrapper = new XcAutocompleteDataWrapper(
            () => {
                const details = this.selectedDetails();
                return details ? details.executionDestination : null;
            },
            value => {
                const details = this.selectedDetails();
                if (details) {
                    details.executionDestination = value;
                }
            }
        );

        this.monitoringLevelDataWrapper = new XcAutocompleteDataWrapper(
            () => {
                const details = this.selectedDetails();
                return details ? details.monitoringLevel : null;
            },
            (value: string) => {
                const details = this.selectedDetails();
                if (details) {
                    details.monitoringLevel = value;
                }
            },
            [
                { name: this.i18nService.translateSignal(this.USE_DEFAULT), value: '-1' },
                { name: signal('0'), value: '0' },
                { name: signal('5'), value: '5' },
                { name: signal('10'), value: '10' },
                { name: signal('15'), value: '15' },
                { name: signal('17'), value: '17' },
                { name: signal('18'), value: '18' },
                { name: signal('20'), value: '20' }
            ]
        );

        this.childOrderInheritanceRulesMonitoringLevelDataWrapper = new XcAutocompleteDataWrapper(
            () => this.childOrderInheritanceRulesMonitoringLevel,
            (value: string) => this.childOrderInheritanceRulesMonitoringLevel = value,
            this.monitoringLevelDataWrapper.values
        );

        // filter with query params that are set when jumping from workflow in PMOD to order type overview
        this.route.queryParams.subscribe(queryParams => {
            if (!queryParams.executionDestinationFilter) {
                // console.log('queryParams.executionDestinationFilter === undefined -> nothing to do');
                return;
            }

            console.log('QueryParams: ' + JSON.stringify(queryParams));
            const filterValues = JSON.parse(decodeURI(queryParams.executionDestinationFilter)) as { rtc: string; fqn: string; type: XmomObjectType };
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

            // console.log('executionDestinationFilter.application: ' + executionDestinationFilter.application);
            // console.log('executionDestinationFilter.version: ' + executionDestinationFilter.version);
            // console.log('executionDestinationFilter.workspace: ' + executionDestinationFilter.workspace);
            // console.log('executionDestinationFilter.executionDestination: ' + executionDestinationFilter.executionDestination);

            this.remoteTableDataSource.input = [executionDestinationFilter];
            this.refresh();

            void this.router.navigateByUrl(ORDER_TYPES_URL);
        });
    }

    ngOnDestroy() {
        this.tableInfoChangeSubscription?.unsubscribe();
    }

    private _getDestinations() {

        const details = this.selectedDetails();
        if (!details || !details.runtimeContext) {
            console.warn('could not get destinations for the detail object', details);
            return;
        }

        const obs = this.apiService.startOrder(FMAN_RTC, ISWP.GetDestinations, [details.runtimeContext], XoDestinationTypeArray, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
        this.handleStartOrderResult(obs, (output: any[]) => {
            const dtArr = (output[0] || { data: [] }) as XoDestinationTypeArray;

            this.planningDestinationDataWrapper.values = dtArr.data.map(dt => ({ name: signal(dt.name), value: dt }));
            this.executionDestinationDataWrapper.values = dtArr.data.map(dt => ({ name: signal(dt.name), value: dt }));
        }, 'error! ask admin!');

    }

    private getDetails(entry: XoOrderType) {

        const name = new XoOrderTypeName();
        name.name = entry.fullQualifiedName;

        const obs = this.apiService.startOrder(FMAN_RTC, ISWP.Details, [entry.runtimeContext, name], XoOrderType, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
        this.handleStartOrderResult(obs, output => {
            this.selectedDetails.set((output[0] || null) as XoOrderType);
            const details = this.selectedDetails();
            if (!details) {
                return;
            }
            if (details.monitoringLevel) {
                const negativnumber = new RegExp('^-\\d+$');
                if (negativnumber.test(details.monitoringLevel)) {
                    details.monitoringLevel = '-1';
                } else if (!this.monitoringLevelDataWrapper.values.find(item => item.value === details.monitoringLevel)) {
                    this.monitoringLevelDataWrapper.values.push({ name: signal(details.monitoringLevel), value: details.monitoringLevel });
                }
            } else {
                details.monitoringLevel = '-1';
            }
            this._getDestinations();

            // #region - TODO - this logic may belong to the server ?!
            // defaultPlanningDestination = !OrderType.planningDestinationIsCustom
            if (!details.planningDestination || !details.planningDestination.name) {
                this.defaultPlanningDestination = true;
            }
            if (details.planningDestination && details.planningDestination.name === 'DefaultPlanning') {
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
            rtc: FMAN_RTC,
            duplicate: duplicated,
            UNSPECIFIED_GET_RUNTIME_CONTEXTS_ERROR: this.UNSPECIFIED_GET_RUNTIME_CONTEXTS_ERROR,
            USE_DEFAULT: this.USE_DEFAULT
        };

        XoCapacityInformation.isInModalFlag = true;
        XoCapacityInformation.requiredUniqueKeysAddModal.clear();

        this.dialogService.custom<boolean, AddNewOrderTypeModalComponentData>(AddNewOrderTypeModalComponent, data).afterDismissResult()
            .subscribe({
                next: result => {
                    if (result) {
                        this.refresh();
                    }
                }, 
                error: error => console.log('AddNewOrderTypeModalComponent error = ', error),
                complete: () => XoCapacityInformation.isInModalFlag = false
        });

        // this.dialogService.error('not implemented yet');
    }

    duplicate(entry: XoOrderType) {

        const name = new XoOrderTypeName();
        name.name = entry.fullQualifiedName;

        const obs = this.apiService.startOrder(FMAN_RTC, ISWP.Details, [entry.runtimeContext, name], XoOrderType, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
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
                        const obs = this.apiService.startOrder(FMAN_RTC, ISWP.Delete, [entry.runtimeContext, name], null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
                        this.handleStartOrderResult(obs, () => {
                            this.selectedDetails.set(null);
                            this.clearSelection();
                        }, this.UNSPECIFIED_DETAILS_ERROR, () => this.refresh());
                    }
                }
            }
        );
    }

    dismiss() {
        this.selectedDetails.set(null);
        this.clearSelection();
    }

    save() {

        const details = this.selectedDetails();
        if (!details) {
            return;
        }
        if (!details.priorityIsCustom) {
             delete details.priority;
        }

        this.writeOrderTypeCapacitiesToDetailsObject();
        this.writeUsageOfRequiredCapacitiesToDetailsObjectFromDetailsPanelCapacity();

        // make sure that there are no rules in the order type
        details.parameterInheritanceRules.data.splice(0, details.parameterInheritanceRules.data.length);
        // save all rules in the ordertype, which will be sent to the server
        let item: XcRichListItem<ChildOrderInheritanceRuleComponentData>;
        for (item of this.childOrderInheritanceRulesItems) {
            details.parameterInheritanceRules.data.push(item.data.rule);
        }

        const obs = this.apiService.startOrder(FMAN_RTC, ISWP.Save, details.clone(), null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
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

        const details = this.selectedDetails();
        if (details && details.parameterInheritanceRules) {
            details.parameterInheritanceRules.data.forEach(
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
        const details = this.selectedDetails();
        if (!details) {
            return;
        }
        details.requiredCapacities.data.forEach(
            cap => {
                const capi = new XoCapacityInformation();
                capi.name = cap.name;
                capi.inuse = cap.cardinality;
                XoCapacityInformation.requiredUniqueKeys.set(cap.uniqueKey, capi);
            }
        );
    }

    private writeOrderTypeCapacitiesToDetailsObject() {
        const details = this.selectedDetails();
        if (!details) {
            return;
        }
        const capArr = new XoCapacityArray();
        XoCapacityInformation.requiredUniqueKeys.forEach(capi => {
            const cap = new XoCapacity();
            cap.name = capi.name;
            cap.cardinality = capi.inuse;
            capArr.data.push(cap);
        });
        details.requiredCapacities = capArr;
    }

    private readUsageOfRequiredCapacitiesFromDetailsObjectAndAddToDetailsPanelCapacity() {

        if (this.dsOrderTypeCapacitiesDataSource && this.dsOrderTypeCapacitiesDataSource.rows) {

            const nameUsageMap = new Map<string, number>();
            const details = this.selectedDetails();
            if (!details) {
                return;
            }
            details.requiredCapacities.data.forEach(rc => {
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
            const details = this.selectedDetails();
            if (!details) {
                return;
            }

            details.requiredCapacities.data.forEach(rc => {
                nameUsageMap.set(rc.name, rc.cardinality);
            });

            this.dsOrderTypeCapacitiesDataSource.rows.forEach(cap => {
                nameUsageMap.set(cap.name, cap.usage);
            });

            details.requiredCapacities.data.forEach(rc => {
                // cardinality is the usage of the Capacities in the detail panel of the selected order type
                rc.cardinality = nameUsageMap.get(rc.name);
            });
        }
    }

    refreshOrderTypeCapacitiesDataSource() {

        const details = this.selectedDetails();
        if (!details) {
            return;
        }
        const name = new XoOrderTypeName();
        name.name = details.fullQualifiedName;

        const obs = this.apiService.startOrder(FMAN_RTC, ISWP.Details, [details.runtimeContext, name], XoOrderType, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
        this.handleStartOrderResult(obs, output => {

            this.selectedDetails.set((output[0] || null) as XoOrderType);

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

        const details = this.selectedDetails();
        const url = PROCESS_MODELLER_TAB_URL + QueryParameterService.createQueryValue(details.runtimeContext.toRuntimeContext().uniqueKey, this.executionDestinationDataWrapper.value.value, EXECUTION_DESTINATION_DOCUMENT_TYPE);
        void this.router.navigateByUrl(url);
    }

    showPaths() {
        this.orderTypeTableFilter.showPath = !this.orderTypeTableFilter.showPath;
        this.remoteTableDataSource.refresh();
    }

}

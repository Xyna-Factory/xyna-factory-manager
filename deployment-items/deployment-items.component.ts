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
import { Component, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { QueryParameterService } from '@zeta/nav/query-parameter.service';
import { ApiService, RuntimeContext, RuntimeContextType, StartOrderOptionsBuilder, XoRuntimeContext } from '@zeta/api';
import { dateTimeString } from '@zeta/base';
import { I18nService } from '@zeta/i18n';
import { XcAutocompleteDataWrapper, XcDialogService, XcOptionItem, XoRemappingTableInfoClass, XoTableInfo } from '@zeta/xc';

import { filter, map } from 'rxjs/operators';

import { FM_RTC, PROCESS_MODELLER_TAB_URL } from '../const';
import { FactoryManagerSettingsService } from '../misc/services/factory-manager-settings.service';
import { WorkflowTesterDialogComponent } from '../workflow-tester/workflow-tester-dialog.component';
import { DeleteReportComponent, DeleteReportComponentData } from './modal/delete-report/delete-report.component';
import { DeployModalComponent, DeployModalComponentData } from './modal/deploy-modal/deploy-modal.component';
import { UndeployReportComponent, UndeployReportComponentData } from './modal/undeploy-report/undeploy-report.component';
import { DEPLOYMENT_ITEMS_ISWP, RestorableDeploymentItemsComponent } from './restorable-deployment-items.component';
import { XoDeleteDeploymentItemParam, XoDeleteDeploymentItemParamArray } from './xo/xo-delete-deployment-item-param.model';
import { XoDeleteDeploymentItemResultArray } from './xo/xo-delete-deployment-item-result.model';
import { XoDeploymentItem, XoDeploymentItemArray } from './xo/xo-deployment-item.model';
import { XoUndeployDeploymentItemResultArray } from './xo/xo-undeploy-deployment-item-result.model';
import { XoUndeployDeploymentItemParam, XoUndeployDeploymentItemParamArray } from './xo/xo-undeployment-deployment-item-param.model';


const ISWP = DEPLOYMENT_ITEMS_ISWP;


@Component({
    templateUrl: './deployment-items.component.html',
    styleUrls: ['./deployment-items.component.scss'],
    standalone: false
})
export class DeploymentItemsComponent extends RestorableDeploymentItemsComponent {

    detailsLastStateChange: string;
    detailsLastModified: string;

    runtimeContextsLoading = false;
    runtimeContextsDataWrapper: XcAutocompleteDataWrapper<XoRuntimeContext>;

    selectedRuntimeContext: XoRuntimeContext;
    detailsRuntimeContext: XoRuntimeContext;


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
        this.initRemoteTableDataSource(XoDeploymentItem, XoDeploymentItemArray, FM_RTC, ISWP.List);

        // const deploymentItemStates: XcOptionItem[] = [
        //     {icon: XDSIconName.ARROWRIGHT, name: '', value: ''},
        //     {icon: XDSIconName.ARROWRIGHT, name: 'DEPLOYED', value: 'DEPLOYED'},
        //     {icon: XDSIconName.ARROWRIGHT, name: 'SAVED', value: 'SAVED'},
        //     {icon: XDSIconName.ARROWRIGHT, name: 'INVALID', value: 'INVALID'},
        // ];
        // this.remoteTableDataSource.filterEnums.set(XoDeploymentItem.getAccessorMap().state, of(deploymentItemStates));

        this.remoteTableDataSource.tableInfoClass = XoRemappingTableInfoClass(
            XoTableInfo, XoDeploymentItem,
            { src: t => t.id.name, dst: t => t.deploymentItemAttentionNameTemplate }
        );

        this.selectedEntryChange.subscribe(
            selection => {
                if (selection && selection.length === 1) {
                    this.getDetails(selection[0]);
                } else {
                    this.detailsObject = null;
                    this.detailsRuntimeContext = null;
                }
            }
        );

        this.remoteTableDataSource.actionElements = [
            {
                class: 'delete-action-element',
                iconName: 'delete',
                tooltip: this.i18nService.translate('fman.deployment-items.delete'),
                onAction: row => {
                    const paramArr = new XoDeleteDeploymentItemParamArray();
                    const param = new XoDeleteDeploymentItemParam();
                    param.deploymentItemId = row.id;
                    param.recursivlyUndeployIfDeployedAndDependenciesExist = false;
                    param.deleteDependencies = false;
                    paramArr.data.push(param);
                    this.remoteTableDataSource.selectionModel.clear();
                    this.delete(paramArr);
                }
            }
        ];

        this.runtimeContextsDataWrapper = new XcAutocompleteDataWrapper(
            () => this.selectedRuntimeContext,
            (value: XoRuntimeContext) => {
                if (value) {
                    this.selectedRuntimeContext = value;
                    this.runtimeContextsDataWrapper.update();
                    this.remoteTableDataSource.input = value;
                    this.refresh();
                } else {
                    this.remoteTableDataSource.clear();
                }
            },
            []
        );

        this.apiService.runtimeContextChange.pipe(
            // current runtime context must be set
            filter(rtc => rtc && this.runtimeContextsDataWrapper.values.length > 0),
            // map to option with xo runtime context that equals current runtime context
            map(rtc => this.runtimeContextsDataWrapper.values.filter(option => rtc.equals(option.value.toRuntimeContext()))[0]),
            // option must be set
            filter(option => !!option),
            // map to xo runtime context
            map(option => option.value)
        ).subscribe(rtc => {
            this.selectedRuntimeContext = rtc;
            this.runtimeContextsDataWrapper.update();
            this.remoteTableDataSource.input = rtc;
            this.refresh();
        });

        // fetch runtime contexts for auto complete
        this.runtimeContextsLoading = true;
        this.apiService.getRuntimeContexts().subscribe(
            rtcs  => {
                this.runtimeContextsDataWrapper.values = rtcs.map(rtc => (<XcOptionItem>{value: rtc, name: rtc.toString()}));
                this.setDefaultRTC();
            },
            error => this.dialogService.error(error),
            ()    => this.runtimeContextsLoading = false
        );
    }


    /**
     * @description Sets the selected modeller rtc as rtc, fallback is the default rtc
     */
    private setDefaultRTC() {
        // Because you can only choose workspaces this can be used to find the XoRuntimeContext in the datawrapper
        const uniqueKey = `${RuntimeContextType.Workspace},${
            this.apiService.runtimeContext && this.apiService.runtimeContext.ws && this.apiService.runtimeContext.ws.workspace
                ? this.apiService.runtimeContext.ws.workspace
                : XoRuntimeContext.fromType('Workspace', RuntimeContext.defaultWorkspace.ws.workspace, -1).uniqueKey
        }`;
        const optionItem = this.runtimeContextsDataWrapper.values
            .find(item => item.value?.uniqueKey === uniqueKey);
        if (optionItem) {
            this.remoteTableDataSource.input = optionItem.value;
            this.selectedRuntimeContext = optionItem.value;
            this.runtimeContextsDataWrapper.update();
            this.refresh();
        }
    }


    private getDetails(entry: XoDeploymentItem) {
        const obs = this.apiService.startOrder(FM_RTC, ISWP.Details, [entry.id, this.selectedRuntimeContext], XoDeploymentItem, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
        this.handleStartOrderResult(obs, output => {
            this.detailsObject = (output[0] || null) as XoDeploymentItem;
            this.detailsRuntimeContext  = this.selectedRuntimeContext.clone();
            this.detailsLastStateChange = dateTimeString(this.detailsObject.lastStateChange, false);
            this.detailsLastModified    = dateTimeString(this.detailsObject.lastModified, false);
        }, this.UNSPECIFIED_DETAILS_ERROR, null, error => {
            this.detailsRuntimeContext = null;
            this.dismiss();
        });
    }


    delete(itemParamsArr?: XoDeleteDeploymentItemParamArray, confirmFirst = true) {
        const deleteFunc = () => {
            let params = itemParamsArr;

            if (!params) {
                params = new XoDeleteDeploymentItemParamArray();
                this.remoteTableDataSource.selectionModel.selection.forEach(item => {
                    const param = new XoDeleteDeploymentItemParam();
                    param.deploymentItemId = item.id;

                    param.deleteDependencies = false;
                    param.recursivlyUndeployIfDeployedAndDependenciesExist = false;
                    params.data.push(param);
                });
            }

            const obs = this.apiService.startOrder(
                FM_RTC, ISWP.Delete,
                [params, this.selectedRuntimeContext],
                XoDeleteDeploymentItemResultArray,
                StartOrderOptionsBuilder.defaultOptionsWithErrorMessage
            );

            this.handleStartOrderResult(obs, output => {
                const resOutputArr = output[0] as XoDeleteDeploymentItemResultArray;

                const resInputArr = new XoDeleteDeploymentItemResultArray();
                resOutputArr.data.forEach(res => {
                    if (!res.success) {
                        resInputArr.data.push(res);
                    }
                });

                if (resInputArr.data.length) {
                    // console.log('Deleting was (partially/completely) unsuccessful - starting "Undeploy Report"');

                    this.dialogService.custom<XoDeleteDeploymentItemParamArray, DeleteReportComponentData>(
                        DeleteReportComponent,
                        {results: resInputArr, i18nService: this.i18nService}
                    ).afterDismissResult().subscribe(paramArr => {
                        if (paramArr) {
                            this.delete(paramArr, false);
                        }
                    });

                } else {
                    // console.log('Undeploying was successful');
                    this.remoteTableDataSource.refresh();
                }
            }, this.UNSPECIFIED_DELETE_ERROR, () => { }, msg => { });
        };

        if (confirmFirst) {
            this.dialogService.confirm(
                this.i18nService.translate(this.FM_DELETE_ENTRY_HEADER),
                this.i18nService.translate(this.CONFIRM_DELETE)
            ).afterDismissResult().subscribe(
                value => {
                    if (value) {
                        deleteFunc();
                    }
                }
            );
        } else {
            deleteFunc();
        }
    }


    deleteHandler() {
        const paramArr = new XoDeleteDeploymentItemParamArray();
        this.remoteTableDataSource.selectionModel.selection.forEach(item => {
            const param = new XoDeleteDeploymentItemParam();
            param.deploymentItemId = item.id;
            param.recursivlyUndeployIfDeployedAndDependenciesExist = false;
            param.deleteDependencies = false;
            paramArr.data.push(param);
        });
        this.delete(paramArr);
    }


    dismiss() {
        this.detailsObject = null;
        this.clearSelection();
    }


    selectAll() {
        this.remoteTableDataSource.selectionModel.suppressOperations(() => {
            this.remoteTableDataSource.rows.forEach(row => {
                this.remoteTableDataSource.selectionModel.select(row);
            });
        });
    }


    deploy(forceDeploy = false) {
        const items = new XoDeploymentItemArray();
        items.data.push(...this.remoteTableDataSource.selectionModel.selection);

        const data: DeployModalComponentData = {
            apiService: this.apiService,
            i18nService: this.i18nService,
            rtc: FM_RTC,
            deployWorkflow: forceDeploy ? ISWP.ForceDeploy : ISWP.Deploy,
            items: items,
            runtimeContext: this.selectedRuntimeContext,
            UNSPECIFIED_DEPLOY_ERROR: this.UNSPECIFIED_DEPLOY_ERROR,
            applyButton: forceDeploy ? 'button-force-deploy' : 'button-deploy'
        };

        this.dialogService.custom<boolean, DeployModalComponentData>(DeployModalComponent, data).afterDismissResult().subscribe(res => {
            if (res) {
                this.remoteTableDataSource.selectionModel.clear();
                this.remoteTableDataSource.refresh();
            }
        });
    }

    undeploy(itemParamsArr?: XoUndeployDeploymentItemParamArray) {

        let params = itemParamsArr;

        if (!params) {
            params = new XoUndeployDeploymentItemParamArray();
            this.remoteTableDataSource.selectionModel.selection.forEach(item => {
                const param = new XoUndeployDeploymentItemParam();
                param.deploymentItemId = item.id;
                param.undeployDependendObjects = false;
                param.disableChecks = false;
                params.data.push(param);
            });
        }

        const obs = this.apiService.startOrder(
            FM_RTC, ISWP.Undeploy,
            [params, this.selectedRuntimeContext],
            XoUndeployDeploymentItemResultArray,
            StartOrderOptionsBuilder.defaultOptionsWithErrorMessage
        );
        this.handleStartOrderResult(obs, output => {
            const resOutputArr = output[0] as XoUndeployDeploymentItemResultArray;

            const resInputArr = new XoUndeployDeploymentItemResultArray();
            resOutputArr.data.forEach(res => {
                if (!res.success) {
                    resInputArr.data.push(res);
                }
            });

            if (resInputArr.data.length) {
                // console.log('Undeploying was (partially/completely) unsuccessful - starting "Undeploy Report"');

                this.dialogService.custom<XoUndeployDeploymentItemParamArray, UndeployReportComponentData>
                (UndeployReportComponent, {results: resInputArr, i18nService: this.i18nService}).afterDismissResult().subscribe(
                    paramArr => {
                        if (paramArr) {
                            this.undeploy(paramArr);
                        }
                    }
                );

            } else {
                // console.log('Undeploying was successful');
                this.remoteTableDataSource.refresh();
            }
        }, this.UNSPECIFIED_UNDEPLOY_ERROR, () => {}, msg => {});
    }


    test() {
        const item = this.selection[0];
        this.dialogService.custom(WorkflowTesterDialogComponent, {
            runtimeContext: this.selectedRuntimeContext.toRuntimeContext(),
            orderType: item.id.name
        }).afterDismiss().subscribe();
    }

    open(type: string) {
        const item = this.selection[0];
        const rtc = this.selectedRuntimeContext.toRuntimeContext().uniqueKey;
        const url = PROCESS_MODELLER_TAB_URL + QueryParameterService.createQueryValue(rtc, item.id.name, type);
        void this.router.navigateByUrl(url);
    }

    singleObject(type: string): boolean {
        return this.selection.length === 1 && this.selection[0].id.type === type;
    }

    get testButtonDisabled(): boolean {
        return this.selection.length !== 1 || this.selection[0].id.type !== 'WORKFLOW';
    }


    get selection(): XoDeploymentItem[] {
        return this.remoteTableDataSource.selectionModel.selection;
    }

    get inconsistencies(): string {
        return this.detailsObject.inconsitencies.data.map(incon => incon.friendlyString)
            .reduce((pre, curr) => pre.concat('\n \n', curr));
    }
}

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

import { ApiService, StartOrderOptionsBuilder } from '@zeta/api';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XcAutocompleteDataWrapper, XcDialogComponent, XcDialogService, XcOptionItem, XcRemoteTableDataSource, XoRemappingTableInfoClass, XoTableInfo } from '@zeta/xc';

import { throwError } from 'rxjs';
import { catchError, filter, finalize, map, tap } from 'rxjs/operators';

import { FM_RTC } from '../../../const';
import { FactoryManagerSettingsService } from '../../../misc/services/factory-manager-settings.service';
import { createFilterEnumOfState } from '../../dependencies';
import { ORDER_TYPES } from '../../order-types';
import { XoLoadRTARequest } from '../../xo/xo-load-rtarequest.model';
import { XoRuntimeApplication, XoRuntimeApplicationArray } from '../../xo/xo-runtime-application.model';
import { XoWorkspace, XoWorkspaceArray } from '../../xo/xo-workspace.model';
import { loadRuntimeApplication_translations_de_DE } from './locale/load-runtime-application-translations.de-DE';
import { loadRuntimeApplication_translations_en_US } from './locale/load-runtime-application-translations.en-US';


class RuntimeApplicationsTableInfo extends XoTableInfo {
    protected afterDecode() {
        this.columns.data.forEach(column => {
            if (column.path === XoRuntimeApplication.getAccessorMap().state) {
                column.shrink = true;
            }
        });
    }
}


@Component({
    templateUrl: './load-runtime-application-dialog.component.html',
    styleUrls: ['./load-runtime-application-dialog.component.scss'],
    standalone: false
})
export class LoadRuntimeApplicationDialogComponent extends XcDialogComponent<boolean, {workspaceName: string; runtimeApplication: XoRuntimeApplication}> {

    workspaceDataWrapper: XcAutocompleteDataWrapper<XoWorkspace>;
    workspace: XoWorkspace;

    dataSource: XcRemoteTableDataSource<XoRuntimeApplication>;
    documentation = '';
    overwrite = true;
    loading: boolean;

    constructor(injector: Injector, private readonly apiService: ApiService, private readonly dialogService: XcDialogService, private readonly i18n: I18nService, private readonly settings: FactoryManagerSettingsService) {
        super(injector);

        this.i18n.setTranslations(LocaleService.DE_DE, loadRuntimeApplication_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, loadRuntimeApplication_translations_en_US);

        const remappingTableInfoClass = XoRemappingTableInfoClass(
            RuntimeApplicationsTableInfo,
            XoRuntimeApplication,
            { src: t => t.state, dst: t => t.stateTemplates }
        );

        // create data wrapper
        this.workspaceDataWrapper = new XcAutocompleteDataWrapper(
            () => this.workspace,
            () => {},
            this.apiService.startOrderAssertFlat<XoWorkspace>(FM_RTC, ORDER_TYPES.GET_WORKSPACES, undefined, XoWorkspaceArray).pipe(
                tap(workspaces => this.changeWorkspace(workspaces.find(workspace => workspace.name === this.injectedData.workspaceName))),
                map(workspaces => workspaces.map(workspace => <XcOptionItem>{name: workspace.name, value: workspace}))
            )
        );

        // create data source
        this.dataSource = new XcRemoteTableDataSource(this.apiService, undefined, FM_RTC, ORDER_TYPES.GET_RUNTIME_APPLICATIONS_TABLE, remappingTableInfoClass);
        this.dataSource.output = XoRuntimeApplicationArray;
        this.dataSource.refreshOnFilterChange = this.settings.tableRefreshOnFilterChange;
        this.dataSource.filterEnums.set(XoRuntimeApplication.getAccessorMap().stateTemplates, createFilterEnumOfState(this.i18n));
        this.dataSource.refresh();
    }


    changeWorkspace(workspace: XoWorkspace) {
        if (this.workspace !== workspace) {
            this.workspace = workspace;
        }
    }


    load() {
        this.loading = true;
        const request = new XoLoadRTARequest();
        request.runtimeApplication = this.runtimeApplication.proxy();
        request.workspace = this.workspace.proxy();
        request.documentation = this.documentation;
        request.overwrite = this.overwrite;

        this.apiService.startOrder(FM_RTC, ORDER_TYPES.LOAD_RUNTIME_APPLICATION_INTO_WORKSPACE, request, undefined, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).pipe(
            catchError((error: any) => {
                this.dismiss();
                return throwError(error);
            }),
            tap(result => this.dismiss(!result.errorMessage ? true : undefined)),
            filter(result => !!result.errorMessage),
            tap(result => this.dialogService.error(result.errorMessage, null, result.stackTrace.join('\r\n'))),
            finalize(() => {
                this.loading = false;
            })
        ).subscribe();
    }


    get runtimeApplication(): XoRuntimeApplication {
        return this.injectedData.runtimeApplication || this.dataSource.selectionModel.selection[0];
    }
}

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
import { XcAutocompleteDataWrapper, XcDialogComponent, XcDialogService, XcOptionItem } from '@zeta/xc';

import { throwError } from 'rxjs';
import { catchError, filter, finalize, map, tap } from 'rxjs/operators';

import { FM_RTC } from '../../../const';
import { ORDER_TYPES } from '../../order-types';
import { XoApplicationDefinition } from '../../xo/xo-application-definition.model';
import { XoCreateRTARequest } from '../../xo/xo-create-rtarequest.model';
import { XoWorkspace, XoWorkspaceArray } from '../../xo/xo-workspace.model';
import { createRuntimeApplication_translations_de_DE } from './locale/create-runtime-application-translations.de-DE';
import { createRuntimeApplication_translations_en_US } from './locale/create-runtime-application-translations.en-US';


type RuntimeApplicationVersion = string;


@Component({
    templateUrl: './create-runtime-application-dialog.component.html',
    styleUrls: ['./create-runtime-application-dialog.component.scss'],
    standalone: false
})
export class CreateRuntimeApplicationDialogComponent extends XcDialogComponent<RuntimeApplicationVersion, {workspaceName: string; applicationDefinitionName: string}> {

    workspaceDataWrapper: XcAutocompleteDataWrapper<XoWorkspace>;
    workspace: XoWorkspace;

    applicationDefinitionDataWrapper: XcAutocompleteDataWrapper<XoApplicationDefinition>;
    applicationDefinition: XoApplicationDefinition;

    version = '';
    documentation = '';
    loading: boolean;

    constructor(injector: Injector, private readonly apiService: ApiService, private readonly dialogService: XcDialogService, private readonly i18n: I18nService) {
        super(injector);

        this.i18n.setTranslations(LocaleService.DE_DE, createRuntimeApplication_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, createRuntimeApplication_translations_en_US);

        this.workspaceDataWrapper = new XcAutocompleteDataWrapper(
            () => this.workspace,
            () => {},
            this.apiService.startOrderAssertFlat<XoWorkspace>(FM_RTC, ORDER_TYPES.GET_WORKSPACES, undefined, XoWorkspaceArray).pipe(
                tap(workspaces => this.changeWorkspace(workspaces.find(workspace => workspace.name === this.injectedData.workspaceName))),
                map(workspaces => workspaces.map(workspace => <XcOptionItem>{name: workspace.name, value: workspace}))
            )
        );

        this.applicationDefinitionDataWrapper = new XcAutocompleteDataWrapper(
            ()                    => this.applicationDefinition,
            applicationDefinition => this.applicationDefinition = applicationDefinition,
            []
        );
    }


    changeWorkspace(workspace: XoWorkspace) {
        if (this.workspace !== workspace) {
            this.workspace = workspace;

            // pre-set application definition
            this.applicationDefinition = this.workspace.applicationDefinitions.data.find(applicationDefinition => applicationDefinition.name === this.injectedData.applicationDefinitionName);

            // update application definition options
            this.applicationDefinitionDataWrapper.values = this.workspace
                ? this.workspace.applicationDefinitions.data.map(applicationDefinition => <XcOptionItem>{name: applicationDefinition.name, value: applicationDefinition})
                : [];
        }
    }


    create() {
        const request = new XoCreateRTARequest();
        request.applicationDefinition = this.applicationDefinition.proxy();
        request.version = this.version;
        request.documentation = this.documentation;
        this.loading = true;
        this.apiService.startOrder(FM_RTC, ORDER_TYPES.CREATE_RUNTIME_APPLICATION, request, undefined, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).pipe(
            catchError((error: any) => {
                this.dismiss();
                return throwError(error);
            }),
            tap(result => this.dismiss(!result.errorMessage ? this.version : undefined)),
            filter(result => !!result.errorMessage),
            tap(result => this.dialogService.error(result.errorMessage, null, result.stackTrace.join('\r\n'))),
            finalize(() => {
                this.loading = false;
            })
        ).subscribe();
    }
}

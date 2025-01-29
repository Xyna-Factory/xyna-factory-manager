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
import { catchError, filter, map, tap } from 'rxjs/operators';

import { FM_RTC } from '../../../const';
import { ORDER_TYPES } from '../../order-types';
import { XoCreateADRequest } from '../../xo/xo-create-adrequest.model';
import { XoWorkspace, XoWorkspaceArray } from '../../xo/xo-workspace.model';
import { createApplicationDefinition_translations_de_DE } from './locale/create-application-definition-translations.de-DE';
import { createApplicationDefinition_translations_en_US } from './locale/create-application-definition-translations.en-US';


type ApplicationDefinitionName = string;
type WorkspaceName = string;


@Component({
    templateUrl: './create-application-definition-dialog.component.html',
    styleUrls: ['./create-application-definition-dialog.component.scss'],
    standalone: false
})
export class CreateApplicationDefinitionDialogComponent extends XcDialogComponent<ApplicationDefinitionName, WorkspaceName> {

    workspaceDataWrapper: XcAutocompleteDataWrapper<XoWorkspace>;
    workspace: XoWorkspace;

    name = '';
    documentation = '';


    constructor(injector: Injector, private readonly apiService: ApiService, private readonly dialogService: XcDialogService, private readonly i18n: I18nService) {
        super(injector);

        this.i18n.setTranslations(LocaleService.DE_DE, createApplicationDefinition_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, createApplicationDefinition_translations_en_US);

        this.workspaceDataWrapper = new XcAutocompleteDataWrapper(
            () => this.workspace,
            () => {},
            this.apiService.startOrderAssertFlat<XoWorkspace>(FM_RTC, ORDER_TYPES.GET_WORKSPACES, undefined, XoWorkspaceArray).pipe(
                tap(workspaces => this.changeWorkspace(workspaces.find(workspace => workspace.name === this.injectedData))),
                map(workspaces => workspaces.map(workspace => <XcOptionItem>{name: workspace.name, value: workspace}))
            )
        );
    }


    changeWorkspace(workspace: XoWorkspace) {
        if (this.workspace !== workspace) {
            this.workspace = workspace;
        }
    }


    create() {
        const request = new XoCreateADRequest();
        request.workspace = this.workspace.proxy();
        request.name = this.name;
        request.documentation = this.documentation;

        this.apiService.startOrder(FM_RTC, ORDER_TYPES.CREATE_APPLICATION_DEFINITION, request, undefined, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).pipe(
            catchError((error: any) => {
                this.dismiss();
                return throwError(error);
            }),
            tap(result => this.dismiss(!result.errorMessage ? this.name : undefined)),
            filter(result => !!result.errorMessage),
            tap(result => this.dialogService.error(result.errorMessage, null, result.stackTrace.join('\r\n')))
        ).subscribe();
    }
}

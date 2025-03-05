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
import { XcAutocompleteDataWrapper, XcDialogComponent, XcDialogService, XcOptionItem, XcOptionItemString } from '@zeta/xc';

import { throwError } from 'rxjs';
import { catchError, filter, finalize, tap } from 'rxjs/operators';

import { FM_RTC } from '../../../const';
import { ORDER_TYPES } from '../../order-types';
import { XoCreateWorkspaceRequest } from '../../xo/xo-create-workspace-request.model';
import { XoRepositoryLink } from '../../xo/xo-repository-link.model';
import { XoSVNRepositoryLink } from '../../xo/xo-svn-repository-link.model';
import { createWorkspace_translations_de_DE } from './locale/create-workspace-translations.de-DE';
import { createWorkspace_translations_en_US } from './locale/create-workspace-translations.en-US';


type WorkspaceName = string;


@Component({
    templateUrl: './create-workspace-dialog.component.html',
    styleUrls: ['./create-workspace-dialog.component.scss'],
    standalone: false
})
export class CreateWorkspaceDialogComponent extends XcDialogComponent<WorkspaceName, void> {

    readonly SVNRepositoryAccess = 'SVNRepositoryAccess';

    repositoryLinkTypeDataWrapper: XcAutocompleteDataWrapper<string>;
    repositoryLinkType: string;
    repositoryLink: XoRepositoryLink;
    loading: boolean;
    name = '';


    constructor(injector: Injector, private readonly apiService: ApiService, private readonly dialogService: XcDialogService, private readonly i18n: I18nService) {
        super(injector);

        this.i18n.setTranslations(LocaleService.DE_DE, createWorkspace_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, createWorkspace_translations_en_US);

        this.repositoryLinkTypeDataWrapper = new XcAutocompleteDataWrapper(
            ()                 => this.repositoryLinkType,
            repositoryLinkType => {
                this.repositoryLinkType = repositoryLinkType;
                switch (this.repositoryLinkType) {
                    case this.SVNRepositoryAccess: {
                        const svnRepositoryLink = new XoSVNRepositoryLink();
                        svnRepositoryLink.linkType = this.SVNRepositoryAccess;
                        svnRepositoryLink.hookManagerPort = '3690';
                        this.repositoryLink = svnRepositoryLink;
                        break;
                    }
                    default:
                        this.repositoryLink = undefined;
                }
            },
            [<XcOptionItem>{name: 'None', value: undefined}, XcOptionItemString(this.SVNRepositoryAccess)]
            /*
            this.apiService.startOrderAssertFlat<XoRepositoryLinkType>(FM_RTC, ORDER_TYPES., undefined, XoRepositoryLinkType).pipe(
                map(repositoryLinkTypes => repositoryLinkTypes.map(repositoryLinkType => XcOptionItemString(repositoryLinkType.value)))
            )
            */
        );
    }


    create() {
        const request = new XoCreateWorkspaceRequest();
        request.name = this.name;
        request.repositoryLink = this.repositoryLink;
        this.loading = true;
        this.apiService.startOrder(FM_RTC, ORDER_TYPES.CREATE_WORKSPACE, request, undefined, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).pipe(
            catchError((error: any) => {
                this.dismiss();
                return throwError(error);
            }),
            tap(result => this.dismiss(!result.errorMessage ? this.name : undefined)),
            filter(result => !!result.errorMessage),
            tap(result => this.dialogService.error(result.errorMessage, null, result.stackTrace.join('\r\n'))),
            finalize(() => {
                this.loading = false;
            })
        ).subscribe();
    }
}

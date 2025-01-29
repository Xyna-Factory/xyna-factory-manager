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
import { XcDialogComponent, XcDialogService } from '@zeta/xc';

import { throwError } from 'rxjs';
import { catchError, filter, finalize, tap } from 'rxjs/operators';

import { FM_RTC } from '../../../const';
import { ORDER_TYPES } from '../../order-types';
import { XoDeleteWorkspaceRequest } from '../../xo/xo-delete-workspace-request.model';
import { XoWorkspace } from '../../xo/xo-workspace.model';
import { deleteWorkspace_translations_de_DE } from './locale/delete-workspace-translations.de-DE';
import { deleteWorkspace_translations_en_US } from './locale/delete-workspace-translations.en-US';


@Component({
    templateUrl: './delete-workspace-dialog.component.html',
    styleUrls: ['./delete-workspace-dialog.component.scss'],
    standalone: false
})
export class DeleteWorkspaceDialogComponent extends XcDialogComponent<boolean, XoWorkspace> {

    stopRunningOrders = false;
    insurancePolicy = false;
    loading = false;

    constructor(injector: Injector, private readonly apiService: ApiService, private readonly dialogService: XcDialogService, private readonly i18n: I18nService) {
        super(injector);

        this.i18n.setTranslations(LocaleService.DE_DE, deleteWorkspace_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, deleteWorkspace_translations_en_US);
    }


    delete() {
        const request = new XoDeleteWorkspaceRequest();
        request.workspace = this.injectedData.proxy();
        request.stopRunningOrders = this.stopRunningOrders;
        this.loading = true;
        this.apiService.startOrder(FM_RTC, ORDER_TYPES.DELETE_WORKSPACE, request, undefined, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).pipe(
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
}

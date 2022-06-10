/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2022 GIP SmartMercial GmbH, Germany
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
import { I18nService } from '@zeta/i18n';
import { XcDialogComponent, XcDialogService } from '@zeta/xc';

import { throwError } from 'rxjs/';
import { catchError, filter, finalize, tap } from 'rxjs/operators';

import { FM_RTC } from '../../../const';
import { ORDER_TYPES } from '../../order-types';
import { XoClearWorkspaceRequest } from '../../xo/xo-clear-workspace-request.model';
import { XoWorkspace } from '../../xo/xo-workspace.model';
import { clearWorkspace_translations_de_DE } from './locale/clear-workspace-translations.de-DE';
import { clearWorkspace_translations_en_US } from './locale/clear-workspace-translations.en-US';


@Component({
    templateUrl: './clear-workspace-dialog.component.html',
    styleUrls: ['./clear-workspace-dialog.component.scss']
})
export class ClearWorkspaceDialogComponent extends XcDialogComponent<boolean, XoWorkspace> {

    stopRunningOrders = false;
    insurancePolicy = false;
    loading;

    constructor(injector: Injector, private readonly apiService: ApiService, private readonly dialogService: XcDialogService, private readonly i18n: I18nService) {
        super(injector);

        this.i18n.setTranslations(I18nService.DE_DE, clearWorkspace_translations_de_DE);
        this.i18n.setTranslations(I18nService.EN_US, clearWorkspace_translations_en_US);
    }


    clear() {
        const request = new XoClearWorkspaceRequest();
        request.workspace = this.injectedData.proxy();
        request.stopRunningOrders = this.stopRunningOrders;
        this.loading = true;
        this.apiService.startOrder(FM_RTC, ORDER_TYPES.CLEAR_WORKSPACE, request, undefined, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).pipe(
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

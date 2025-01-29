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

import { XoDeleteDuplicatesResponse } from '@fman/runtime-contexts/xo/xo-delete-duplicates-response.model';
import { ApiService, StartOrderOptionsBuilder } from '@zeta/api';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XcDialogComponent, XcDialogService } from '@zeta/xc';

import { throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

import { FM_RTC } from '../../../const';
import { ORDER_TYPES } from '../../order-types';
import { XoWorkspace } from '../../xo/xo-workspace.model';
import { deleteDuplicates_translations_de_DE } from './locale/delete-duplicates-translations.de-DE';
import { deleteDuplicates_translations_en_US } from './locale/delete-duplicates-translations.en-US';


@Component({
    templateUrl: './delete-duplicates-dialog.component.html',
    styleUrls: ['./delete-duplicates-dialog.component.scss'],
    standalone: false
})
export class DeleteDuplicatesDialogComponent extends XcDialogComponent<boolean, XoWorkspace> {

    isLoading = false;

    constructor(injector: Injector, private readonly apiService: ApiService, private readonly dialogService: XcDialogService, private readonly i18n: I18nService) {
        super(injector);

        this.i18n.setTranslations(LocaleService.DE_DE, deleteDuplicates_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, deleteDuplicates_translations_en_US);
    }


    delete() {
        const request = this.injectedData.proxy();
        this.isLoading = true;
        this.apiService.startOrder(FM_RTC, ORDER_TYPES.DELETE_DUPLICATES, request, XoDeleteDuplicatesResponse, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).pipe(
            catchError((error: any) => {
                this.dismiss();
                return throwError(error);
            }),
            tap(result => this.dismiss(!result.errorMessage ? true : undefined)),
            /*filter(result => !!result.errorMessage),
            tap(result => this.dialogService.error(result.errorMessage, null, result.stackTrace.join('\r\n'))),*/

            tap(result => {
                if (result.errorMessage) {
                    this.dialogService.error(result.errorMessage, null, result.stackTrace.join('\r\n'));
                } else {
                    const deleteResponse = result.output[0] as XoDeleteDuplicatesResponse;
                    if (deleteResponse?.problematicFQNs.length > 0) {
                        const problematicFQNsStr = deleteResponse.problematicFQNs.map(fqn => fqn).join('\r\n');
                        const title = this.i18n.translate('fman.delete-duplicates.delete-deletition-incomplete-title');
                        const message = this.i18n.translate('fman.delete-duplicates.delete-deletition-incomplete-message') + ':\r\n' + problematicFQNsStr;
                        this.dialogService.info(title, message);
                    }
                }
            }),

            finalize(() => {
                console.log('PvM finalize');
                this.isLoading = false;
            })
        ).subscribe();
    }
}

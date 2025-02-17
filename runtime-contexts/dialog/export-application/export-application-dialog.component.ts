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
import { environment } from '@environments/environment';
import { XoManagedFileId } from '@fman/runtime-contexts/xo/xo-managed-file-id.model';
import { XoRuntimeApplication } from '@fman/runtime-contexts/xo/xo-runtime-application.model';

import { ApiService, StartOrderOptionsBuilder } from '@zeta/api';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XcDialogComponent, XcDialogService } from '@zeta/xc';

import { filter, finalize } from 'rxjs/operators';

import { FM_RTC } from '../../../const';
import { ORDER_TYPES } from '../../order-types';
import { exportapplication_translations_de_DE } from './locale/export-application-translations.de-DE';
import { exportapplication_translations_en_US } from './locale/export-application-translations.en-US';


@Component({
    templateUrl: './export-application-dialog.component.html',
    styleUrls: ['./export-application-dialog.component.scss'],
    standalone: false
})
export class ExportApplicationDialogComponent extends XcDialogComponent<boolean, XoRuntimeApplication> {

    application: XoRuntimeApplication;
    pending = false;

    constructor(injector: Injector, private readonly apiService: ApiService, private readonly dialogService: XcDialogService, private readonly i18n: I18nService) {
        super(injector);

        this.application = this.injectedData.proxy();

        this.i18n.setTranslations(LocaleService.DE_DE, exportapplication_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, exportapplication_translations_en_US);
    }


    export() {
        this.pending = true;
        this.apiService.startOrder(FM_RTC, ORDER_TYPES.EXPORT_RUNTIME_APPLICATION, this.application, XoManagedFileId, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).pipe(
            filter(result => {
                if (result.errorMessage || !(result?.output[0] as XoManagedFileId)?.id) {
                    this.dismiss(false);
                    if (result.errorMessage) {
                        this.dialogService.error(result.errorMessage, null, result.stackTrace.join('\r\n'));
                    } else {
                        this.dialogService.error(this.i18n.translate('fman.export-application.export-failed', {key: '$0', value: this.application.name}));
                    }
                    return false;
                }
                return true;
            }),
            finalize(() => this.pending = false)
        ).subscribe(result => {
            const fileId = (result.output[0] as XoManagedFileId).id;
            window.location.href = `${environment.zeta.url}download?p0=${fileId}`;
            this.dismiss(true);
        });
    }
}

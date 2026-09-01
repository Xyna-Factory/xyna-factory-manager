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

import { filter, finalize } from 'rxjs/operators';

import { Component, inject } from '@angular/core';
import { FMAN_RTC } from '@fman/factory-manager.component';
import { XoManagedFileId } from '@fman/runtime-contexts/xo/xo-managed-file-id.model';
import { XoRuntimeApplication } from '@fman/runtime-contexts/xo/xo-runtime-application.model';
import { ApiService, StartOrderOptionsBuilder } from '@zeta/api';
import { ConfigService } from '@zeta/api/config.service';
import { I18nService, LocaleService, XcI18nContextDirective, XcI18nPipe, XcI18nTranslateDirective } from '@zeta/i18n';
import { XcButtonComponent, XcCheckboxComponent, XcDialogComponent, XcDialogService, XcDialogWrapperComponent } from '@zeta/xc';

import { ORDER_TYPES } from '../../order-types';
import { exportapplication_translations_de_DE } from './locale/export-application-translations.de-DE';
import { exportapplication_translations_en_US } from './locale/export-application-translations.en-US';


@Component({
    templateUrl: './export-application-dialog.component.html',
    styleUrls: ['./export-application-dialog.component.scss'],
    imports: [XcButtonComponent, XcCheckboxComponent, XcDialogWrapperComponent, XcI18nContextDirective, XcI18nTranslateDirective, XcI18nPipe]
})
export class ExportApplicationDialogComponent extends XcDialogComponent<boolean, XoRuntimeApplication> {
    private readonly configService = inject(ConfigService);
    private readonly apiService = inject(ApiService);
    private readonly dialogService = inject(XcDialogService);
    private readonly i18n = inject(I18nService);


    application: XoRuntimeApplication;
    pending = false;

    constructor() {
        super();

        this.application = this.injectedData.proxy();

        this.i18n.setTranslations(LocaleService.DE_DE, exportapplication_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, exportapplication_translations_en_US);
    }


    export() {
        this.pending = true;
        this.apiService.startOrder(FMAN_RTC, ORDER_TYPES.EXPORT_RUNTIME_APPLICATION, this.application, XoManagedFileId, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).pipe(
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
            window.location.href = `${this.configService.config.zeta.url}download?p0=${fileId}`;
            this.dismiss(true);
        });
    }
}

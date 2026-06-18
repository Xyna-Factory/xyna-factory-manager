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
import { Component, inject } from '@angular/core';

import { environment } from '@environments/environment';
import { XoManagedFileId } from '@fman/runtime-contexts/xo/xo-managed-file-id.model';
import { ApiService, StartOrderOptionsBuilder } from '@zeta/api';
import { I18nService, LocaleService, XcI18nContextDirective, XcI18nTranslateDirective } from '@zeta/i18n';
import { XcAutocompleteDataWrapper, XcDialogComponent, XcDialogService, XcOptionItem } from '@zeta/xc';
import { XcModule } from '@zeta/xc/xc.module';

import { filter, finalize } from 'rxjs/operators';

import { FM_RTC } from '../../../const';
import { XynaPropertiesFormat, XYNA_PROPERTY_ISWP } from '../../restorable-xyna-properties.component';
import { XoExportSettings } from '../../xo/xo-export-settings.model';
import { exportXynaProperties_translations_de_DE } from './locale/export-xyna-properties-translations.de-DE';
import { exportXynaProperties_translations_en_US } from './locale/export-xyna-properties-translations.en-US';


const ISWP = XYNA_PROPERTY_ISWP;


@Component({
    templateUrl: './export-xyna-properties-dialog.component.html',
    styleUrls: ['./export-xyna-properties-dialog.component.scss'],
    imports: [XcModule, XcI18nContextDirective, XcI18nTranslateDirective]
})
export class ExportXynaPropertiesDialogComponent extends XcDialogComponent<boolean, void> {
    private readonly apiService = inject(ApiService);
    private readonly dialogService = inject(XcDialogService);
    private readonly i18n = inject(I18nService);

    exportSettings = new XoExportSettings();
    pending = false;

    formatDataWrapper: XcAutocompleteDataWrapper<string> = new XcAutocompleteDataWrapper<string>(
        () => this.exportSettings.format,
        value => this.exportSettings.format = value
    );

    constructor() {
        super();

        this.exportSettings.format = XynaPropertiesFormat.CSV;
        this.exportSettings.filter = '';
        this.exportSettings.includeDocumentation = true;

        this.i18n.setTranslations(LocaleService.DE_DE, exportXynaProperties_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, exportXynaProperties_translations_en_US);

        this.formatDataWrapper.values = [
            <XcOptionItem<string>>{
                name: this.i18n.translate('fman.export-xyna-properties.format-csv'),
                value: XynaPropertiesFormat.CSV
            },
            <XcOptionItem<string>>{
                name: this.i18n.translate('fman.export-xyna-properties.format-yaml'),
                value: XynaPropertiesFormat.YAML
            }
        ];
    }


    export() {
        this.pending = true;
        this.apiService.startOrder(FM_RTC, ISWP.Export, this.exportSettings, XoManagedFileId, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).pipe(
            filter(result => {
                if (result.errorMessage || !(result?.output[0] as XoManagedFileId)?.id) {
                    this.dismiss(false);
                    if (result.errorMessage) {
                        this.dialogService.error(result.errorMessage, null, result.stackTrace?.join('\r\n'));
                    } else {
                        this.dialogService.error(this.i18n.translate('fman.export-xyna-properties.export-failed'));
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

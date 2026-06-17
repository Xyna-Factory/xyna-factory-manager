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
import { throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { ApiService, StartOrderOptionsBuilder } from '@zeta/api';
import { I18nService, LocaleService, XcI18nContextDirective, XcI18nTranslateDirective } from '@zeta/i18n';
import { XcAutocompleteDataWrapper, XcDialogComponent, XcDialogService, XcOptionItem } from '@zeta/xc';
import { XcModule } from '@zeta/xc/xc.module';

import { FM_RTC } from '../../../const';
import { XynaPropertiesFormat, XYNA_PROPERTY_ISWP } from '../../restorable-xyna-properties.component';
import { XoImportSettings } from '../../xo/xo-import-settings.model';
import { XoXynaPropertyExport } from '../../xo/xo-xyna-property-export.model';
import { importXynaProperties_translations_de_DE } from './locale/import-xyna-properties-translations.de-DE';
import { importXynaProperties_translations_en_US } from './locale/import-xyna-properties-translations.en-US';


const ISWP = XYNA_PROPERTY_ISWP;


@Component({
    templateUrl: './import-xyna-properties-dialog.component.html',
    styleUrls: ['./import-xyna-properties-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [XcModule, XcI18nContextDirective, XcI18nTranslateDirective]
})
export class ImportXynaPropertiesDialogComponent extends XcDialogComponent<boolean, void> {
    private readonly apiService = inject(ApiService);
    private readonly dialogService = inject(XcDialogService);
    private readonly i18n = inject(I18nService);
    private readonly cdr = inject(ChangeDetectorRef);

    importData = new XoXynaPropertyExport();
    importSettings = new XoImportSettings();
    filename = '';
    fileReady = false;
    erroneousFilename = false;
    loadingFile = false;
    importing = false;

    formatDataWrapper: XcAutocompleteDataWrapper<XynaPropertiesFormat> = new XcAutocompleteDataWrapper<XynaPropertiesFormat>(
        () => this.importData.exportSettings.format as XynaPropertiesFormat,
        value => this.importData.exportSettings.format = value
    );

    constructor() {
        super();

        this.importData.exportSettings.format = XynaPropertiesFormat.CSV;
        this.importData.exportSettings.includeDocumentation = true;

        this.i18n.setTranslations(LocaleService.DE_DE, importXynaProperties_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, importXynaProperties_translations_en_US);

        this.formatDataWrapper.values = [
            <XcOptionItem<XynaPropertiesFormat>>{
                name: this.i18n.translate('fman.import-xyna-properties.format-csv'),
                value: XynaPropertiesFormat.CSV
            },
            <XcOptionItem<XynaPropertiesFormat>>{
                name: this.i18n.translate('fman.import-xyna-properties.format-yaml'),
                value: XynaPropertiesFormat.YAML
            }
        ];
    }


    chooseFile() {
        this.loadingFile = true;
        this.fileReady = false;
        this.erroneousFilename = false;
        this.apiService.browse(3 * 60 * 1000).subscribe(file => {
            this.filename = file.name;
            this.cdr.markForCheck();

            if (!this.validateFile(file)) {
                this.importData.$data = '';
                this.loadingFile = false;
                this.cdr.markForCheck();
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                let text = typeof reader.result === 'string' ? reader.result : '';
                if (text.charCodeAt(0) === 0xfeff) {
                    text = text.slice(1);
                }
                this.importData.$data = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                this.fileReady = this.importData.$data.trim().length > 0;
                this.loadingFile = false;
                this.cdr.markForCheck();
            };
            reader.onerror = () => {
                this.erroneousFilename = true;
                this.fileReady = false;
                this.importData.$data = '';
                this.loadingFile = false;
                this.cdr.markForCheck();
            };
            reader.readAsText(file, 'UTF-8');
        });
    }


    import() {
        if (!this.fileReady) {
            return;
        }

        this.importing = true;
        this.apiService.startOrder(FM_RTC, ISWP.Import, [this.importData, this.importSettings], undefined, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).pipe(
            tap(result => {
                if (result?.errorMessage) {
                    this.dialogService.error(result.errorMessage, null, result.stackTrace?.join('\r\n'));
                    this.dismiss();
                }
            }),
            catchError((error: unknown) => {
                this.dismiss();
                return throwError(() => error);
            }),
            finalize(() => {
                this.importing = false;
                this.cdr.markForCheck();
            })
        ).subscribe(result => {
            if (!result.errorMessage) {
                this.dismiss(true);
            }
        });
    }


    private validateFile(file: File): boolean {
        const name = file.name.toLowerCase();
        const isCsv = name.endsWith('.csv');
        const isYaml = name.endsWith('.yaml') || name.endsWith('.yml');

        if (!isCsv && !isYaml) {
            this.dialogService.error(this.i18n.translate('fman.import-xyna-properties.invalid-file-type'));
            this.erroneousFilename = true;
            return false;
        }

        const format = this.importData.exportSettings.format as XynaPropertiesFormat;
        const formatMatches = (format === XynaPropertiesFormat.CSV && isCsv)
            || (format === XynaPropertiesFormat.YAML && isYaml);

        if (!formatMatches) {
            this.dialogService.error(this.i18n.translate('fman.import-xyna-properties.format-mismatch'));
            this.erroneousFilename = true;
            return false;
        }

        return true;
    }
}

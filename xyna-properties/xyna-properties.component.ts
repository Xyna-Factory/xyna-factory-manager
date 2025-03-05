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
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService, StartOrderOptionsBuilder } from '@zeta/api';
import { XoDocumentation, XoDocumentationLanguage, XoXynaProperty, XoXynaPropertyArray, XoXynaPropertyKey } from '@zeta/auth/xo/xyna-property.model';
import { I18nService } from '@zeta/i18n';
import { XcComponentTemplate, XcDialogService, XoRemappingTableInfoClass, XoTableInfo } from '@zeta/xc';

import { FM_RTC } from '../const';
import { FactoryManagerSettingsService } from '../misc/services/factory-manager-settings.service';
import { AddNewXynaPropertyModalComponent, AddNewXynaPropertyModalComponentData } from './modal/add-new-xyna-property-modal/add-new-xyna-property-modal.component';
import { RestorableXynaPropertiesComponent, XYNA_PROPERTY_ISWP } from './restorable-xyna-properties.component';
import { XynaPropertyTableValueTemplateComponent, XynaPropertyTableValueTemplateData } from './templates/xyna-property-table-value-template.model';
import { filter } from 'rxjs';


const ISWP = XYNA_PROPERTY_ISWP;


@Component({
    templateUrl: './xyna-properties.component.html',
    styleUrls: ['./xyna-properties.component.scss'],
    standalone: false
})
export class XynaPropertiesComponent extends RestorableXynaPropertiesComponent {


    get detailsObjectLanguageTag(): string {
        return this.detailsObject
            ? this.detailsObject.documentation.data[0]
                ? this.detailsObject.documentation.data[0].language.languageTag
                : ''
            : '';
    }

    get documentation(): string {
        return this.detailsObject
            ? this.detailsObject.documentation.data[0]
                ? this.detailsObject.documentation.data[0].documentation
                : ''
            : '';
    }

    set documentation(value: string) {
        if (this.detailsObject && this.detailsObject.documentation.data[0]) {
            this.detailsObject.documentation.data[0].documentation = value;
        }
    }

    get documentationLabel(): string {
        return this.i18nService.translate(
            'fman.xyna-properties.documentation-label', {key: '$0', value: this.i18nService.translate(this.detailsObjectLanguageTag)}
        );
    }

    constructor(
        apiService: ApiService,
        dialogService: XcDialogService,
        route: ActivatedRoute,
        router: Router,
        i18nService: I18nService,
        injector: Injector,
        settings: FactoryManagerSettingsService
    ) {
        super(apiService, dialogService, route, router, i18nService, injector, settings);

        XoXynaProperty.createTemplatesFn = (property: XoXynaProperty) => {
            const data: XynaPropertyTableValueTemplateData = {
                value: property.value,
                isBold: property.overwrittenDefaultValue
            };
            return [new XcComponentTemplate(XynaPropertyTableValueTemplateComponent, data)];
        };

        this.initRemoteTableDataSource(XoXynaProperty, XoXynaPropertyArray, FM_RTC, ISWP.List);
        const lang = new XoDocumentationLanguage();
        lang.languageTag = i18nService.language;
        this.remoteTableDataSource.input = lang;


        this.remoteTableDataSource.tableInfoClass = XoRemappingTableInfoClass<XoXynaProperty>(
            XoTableInfo,
            XoXynaProperty,
            { src: t => t.value, dst: t => t.templates }
        );

        this.selectedEntryChange.subscribe(
            selection => {
                if (selection && selection.length) {
                    this.getDetails(selection[0]);
                }
            }
        );

        this.remoteTableDataSource.actionElements = [
            {
                class: 'delete-action-element',
                iconName: 'delete',
                tooltip: this.i18nService.translate('fman.xyna-properties.delete'),
                onAction: this.delete.bind(this)
            },
            {
                class: 'copy-action-element',
                iconName: 'copy',
                tooltip: this.i18nService.translate('fman.xyna-properties.duplicate'),
                onAction: this.duplicate.bind(this)
            }
        ];
    }

    private getDetails(entry: XoXynaProperty) {

        const key = new XoXynaPropertyKey();
        key.key = entry.key;

        const obs = this.apiService.startOrder(FM_RTC, ISWP.Details, key, XoXynaProperty, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
        this.handleStartOrderResult(obs, output => {
            this.detailsObject = (output[0] || null) as XoXynaProperty;

            if (!this.detailsObjectLanguageTag) {
                // console.log(`Could not find documentation language of '${this.detailsObject.key}' and is set to '${this.i18nService.language}'`, this.detailsObject);
                this._setLanguageTagOfXynaProperty(this.detailsObject, this.i18nService.language);
            }

        }, this.UNSPECIFIED_DETAILS_ERROR, null);
    }

    clearFilters() {
        this.remoteTableDataSource.resetFilters();
    }

    add(duplicatedProperty: XoXynaProperty = null) {

        const data: AddNewXynaPropertyModalComponentData = {
            addWorkflow: ISWP.Add,
            apiService: this.apiService,
            i18nService: this.i18nService,
            rtc: FM_RTC,
            duplicate: duplicatedProperty
        };

        this.dialogService.custom<boolean, AddNewXynaPropertyModalComponentData>
        (AddNewXynaPropertyModalComponent, data).afterDismissResult()
            .pipe(filter(result => !!result))
            .subscribe(() => this.refresh());
    }

    duplicate(entry: XoXynaProperty) {
        if (entry instanceof XoXynaProperty) {
            const key = new XoXynaPropertyKey();
            key.key = entry.key;
            const obs = this.apiService.startOrder(FM_RTC, ISWP.Details, key, XoXynaProperty, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
            this.handleStartOrderResult(obs, output => {
                const duplicatedProperty = (output[0] || null) as XoXynaProperty;
                this.add(duplicatedProperty);

            }, this.UNSPECIFIED_DETAILS_ERROR);
        } else {
            this.add(entry);
        }
    }

    delete(entry: XoXynaProperty) {
        this.dialogService.confirm(
            this.i18nService.translate(this.FM_DELETE_ENTRY_HEADER),
            this.i18nService.translate(this.CONFIRM_DELETE, {key: '$0', value: entry.key})
        ).afterDismissResult().subscribe(
            value => {
                if (value) {
                    if (entry instanceof XoXynaProperty) {
                        const key = new XoXynaPropertyKey();
                        key.key = entry.key;
                        const obs = this.apiService.startOrder(FM_RTC, ISWP.Delete, key, null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
                        this.handleStartOrderResult(obs, output => {
                            this.detailsObject = null;
                            this.clearSelection();
                            this.refresh();
                        }, this.UNSPECIFIED_DETAILS_ERROR);
                    }
                }
            }
        );
    }

    dismiss() {
        this.detailsObject = null;
        this.clearSelection();
    }

    save() {
        const obs = this.apiService.startOrder(FM_RTC, ISWP.Save, this.detailsObject.clone(), null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
        this.handleStartOrderResult(obs, output => {
            // console.log('save was successful', output);
            this.dismiss();
            this.refresh();
        }, this.UNSPECIFIED_SAVE_ERROR);
    }

    reset() {

        const fn = () => {
            const resetObj = this.detailsObject.clone();
            resetObj.data[XoXynaProperty.getAccessorMap().value] = undefined;
            const obs = this.apiService.startOrder(FM_RTC, ISWP.Save, resetObj, null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
            this.handleStartOrderResult(obs, output => {
                this.dismiss();
                this.refresh();
            }, this.UNSPECIFIED_SAVE_ERROR);
        };

        const title = 'Confirmation';
        const message = this.i18nService.translate(this.CONFIRM_RESTORE, {key: '$0', value: this.detailsObject.key});

        this.dialogService.confirm(title, message).afterDismissResult().subscribe(
            confirmation => {
                if (confirmation) {
                    fn();
                }
            }
        );
    }

    private _setLanguageTagOfXynaProperty(prop: XoXynaProperty, tag: string) {

        let language = prop ? prop.documentation.data[0] : null;

        if (!language) {
            language = new XoDocumentation();
            language.language.languageTag = tag;
            prop.documentation.data.push(language);
        } else {
            language.language.languageTag = tag;
        }
    }
}

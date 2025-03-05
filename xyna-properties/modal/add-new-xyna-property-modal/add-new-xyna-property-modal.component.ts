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
import { Component, Injector, ViewChild } from '@angular/core';

import { ApiService, RuntimeContext, StartOrderOptionsBuilder } from '@zeta/api';
import { XoDocumentation, XoDocumentationLanguage, XoXynaProperty } from '@zeta/auth/xo/xyna-property.model';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XcDialogComponent, XcFormDirective } from '@zeta/xc';

import { FMFocusCandidateRef } from '../../../misc/directives/fm-focus-candidate.directive';
import { addNewXynaProperty_translations_de_DE } from './locale/add-new-xyna-property-translations.de-DE';
import { addNewXynaProperty_translations_en_US } from './locale/add-new-xyna-property-translations.en-US';


export interface AddNewXynaPropertyModalComponentData {
    addWorkflow: string;
    rtc: RuntimeContext;
    apiService: ApiService;
    i18nService: I18nService;
    duplicate: XoXynaProperty;
}

@Component({
    templateUrl: './add-new-xyna-property-modal.component.html',
    styleUrls: ['./add-new-xyna-property-modal.component.scss'],
    standalone: false
})
export class AddNewXynaPropertyModalComponent extends XcDialogComponent<boolean, AddNewXynaPropertyModalComponentData> {

    @ViewChild(XcFormDirective, {static: false})
    xcFormDirective: XcFormDirective;

    get invalid(): boolean {
        return this.xcFormDirective ? this.xcFormDirective.invalid : true;
    }

    errorBoxFocusCandidateRef = FMFocusCandidateRef.getInstance();
    xynaProperty: XoXynaProperty;
    busy = false;

    private _languageTag: string;
    private _error: string;

    get error(): string {
        return this._error;
    }

    set error(value: string) {
        this._error = value;
        if (value) {
            this.errorBoxFocusCandidateRef.focus();
        }
    }

    get documentation(): string {
        return this.xynaProperty.documentation.data[0].documentation;
    }

    set documentation(value: string) {
        this.xynaProperty.documentation.data[0].documentation = value;
    }

    get documentationLabel(): string {
        return this.i18n.translate('Documentation for $0', {key: '$0', value: this.i18n.translate(this._languageTag)});
    }

    constructor(injector: Injector, private readonly i18n: I18nService) {
        super(injector);

        this.i18n.setTranslations(LocaleService.DE_DE, addNewXynaProperty_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, addNewXynaProperty_translations_en_US);

        const addXoDocumentation = () => {
            const doc = new XoDocumentation();
            doc.language = new XoDocumentationLanguage();
            doc.language.languageTag = this.i18n.language || 'en-US';
            this._languageTag = doc.language.languageTag;
            this.xynaProperty.documentation.data.push(doc);
        };

        if (this.injectedData.duplicate) {
            this.xynaProperty = this.injectedData.duplicate.clone();

            if (this.xynaProperty.documentation.data.length) {
                this._languageTag = this.xynaProperty.documentation.data[0].language.languageTag;
            } else {
                addXoDocumentation();
            }
        } else {
            this.xynaProperty = new XoXynaProperty();
            addXoDocumentation();
        }
    }

    add() {
        this.busy = true;
        this.injectedData.apiService.startOrder(
            this.injectedData.rtc, this.injectedData.addWorkflow, this.xynaProperty, null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage)
            .subscribe(
                result => {
                    this.busy = false;
                    if (result && result.errorMessage) {
                        this.error = this.injectedData.i18nService.translateErrorCode(result.errorMessage);
                    } else {
                        this.dismiss(true);
                    }
                }
            );
    }

}

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

import { XoRuntimeContext } from '@zeta/api';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XcAutocompleteDataWrapper, XcDialogComponent } from '@zeta/xc';

import { FMFocusCandidateRef } from '../../../misc/directives/fm-focus-candidate.directive';
import { FactoryManagerSettingsService } from '../../../misc/services/factory-manager-settings.service';
import { selectRuntimeContext_translations_de_DE } from './locale/select-runtime-context-translations.de-DE';
import { selectRuntimeContext_translations_en_US } from './locale/select-runtime-context-translations.en-US';


export interface SelectRuntimeContextComponentData {
    runtimeContextDataWrapper: XcAutocompleteDataWrapper;
    factoryManagerSettingsService: FactoryManagerSettingsService;
    i18nService: I18nService;
    showLoadFeedback: () => boolean;
}

@Component({
    templateUrl: './select-runtime-context.component.html',
    styleUrls: ['./select-runtime-context.component.scss'],
    standalone: false
})
export class SelectRuntimeContextComponent extends XcDialogComponent<boolean, SelectRuntimeContextComponentData> {

    static instanceIsOpen = false;

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
    errorBoxFocusCandidateRef = FMFocusCandidateRef.getInstance();

    runtimeContextsDataWrapper: XcAutocompleteDataWrapper;
    selectedServerRuntimeContext: XoRuntimeContext;

    constructor(injector: Injector, private readonly i18n: I18nService) {
        super(injector);

        this.i18n.setTranslations(LocaleService.DE_DE, selectRuntimeContext_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, selectRuntimeContext_translations_en_US);

        this.runtimeContextsDataWrapper = new XcAutocompleteDataWrapper(
            () => this.selectedServerRuntimeContext,
            (value: XoRuntimeContext) => this.selectedServerRuntimeContext = value
        );
    }

    apply() {
        SelectRuntimeContextComponent.instanceIsOpen = false;
        this.dismiss(true);
    }

}

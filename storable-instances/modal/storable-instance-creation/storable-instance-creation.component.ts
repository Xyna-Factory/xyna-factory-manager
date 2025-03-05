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

import { ApiService, RuntimeContext, StartOrderOptionsBuilder, StartOrderResult } from '@zeta/api';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XcDialogComponent, XcStructureTreeDataSource } from '@zeta/xc';

import { finalize } from 'rxjs/operators';

import { XoStoreParameter } from '../../xo/xo-storeparameter.model';
import { storableInstanceCreation_translations_de_DE } from './locale/storable-instance-creation-translations.de-DE';
import { storableInstanceCreation_translations_en_US } from './locale/storable-instance-creation-translations.en-US';


@Component({
    selector: 'storable-instance-creation',
    templateUrl: './storable-instance-creation.component.html',
    styleUrls: ['./storable-instance-creation.component.scss'],
    standalone: false
})
export class StorableInstanceCreationComponent extends XcDialogComponent<any, any> {
    error = false;
    errorMessage = '';
    isLoading = false;

    readonly storeOrderType = 'xnwh.persistence.Store';
    readonly DEFAULT_ERROR = 'Something went wrong while creating a new storable instance.';
    readonly EMPTY_STORABLE = 'Storable is empty!';

    get structureTreeDataSource(): XcStructureTreeDataSource {
        return this.injectedData.structureTreeDataSource;
    }

    get apiService(): ApiService {
        return this.injectedData.apiService;
    }

    get rtc(): RuntimeContext {
        return this.injectedData.rtc;
    }

    get storeParameter(): XoStoreParameter {
        return this.injectedData.storeParameter;
    }

    get i18nService(): I18nService {
        return this.injectedData.i18nService;
    }

    constructor(injector: Injector) {
        super(injector);

        this.i18nService.setTranslations(LocaleService.DE_DE, storableInstanceCreation_translations_de_DE);
        this.i18nService.setTranslations(LocaleService.EN_US, storableInstanceCreation_translations_en_US);
    }

    submit() {
        let completed = false;
        this.isLoading = true;
        if (!this.structureTreeDataSource.container.data[0]) {
            this.error = true;
            this.isLoading = false;
            this.errorMessage = this.i18nService.translate(this.EMPTY_STORABLE);
        } else {
            this.apiService
                .startOrder(this.rtc, this.storeOrderType, [this.structureTreeDataSource.container.data[0], this.storeParameter], null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage)
                .pipe(
                    finalize(() => {
                        this.isLoading = false;
                        if (!completed) {
                            this.error = true;
                            this.errorMessage = this.i18nService.translate(this.DEFAULT_ERROR);
                        }
                    })
                )
                .subscribe({
                    next: (result: StartOrderResult) => {
                        if (result && !result.errorMessage) {
                            completed = true;
                            this.dismiss(true);
                        }
                    },
                    error: (error: any) => {
                        console.error(error);
                        this.error = true;
                        this.errorMessage = this.i18nService.translate(this.DEFAULT_ERROR);
                    }
                });
        }
    }
}

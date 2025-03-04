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
import { Component, InjectionToken, Injector } from '@angular/core';

import { I18nParam, I18nService, LocaleService } from '@zeta/i18n';
import { XC_COMPONENT_DATA, XcDynamicComponent, XcStringIntegerDataWrapper } from '@zeta/xc';

import { capacities_translations_de_DE } from '../locale/capacities-translations.de-DE';
import { capacities_translations_en_US } from '../locale/capacities-translations.en-US';


export interface CapacityUsageTemplateData {
    order: string;
    cardinality: string;
    usage: XcStringIntegerDataWrapper;
}

@Component({
    selector: 'capacity-usage-template',
    templateUrl: './capacity-usage-template.component.html',
    styleUrls: ['./capacity-usage-template.component.scss'],
    standalone: false
})
export class CapacityUsageTemplateComponent extends XcDynamicComponent<CapacityUsageTemplateData> {

    get order(): string {
        return this.injectedData.order;
    }

    get cardinality(): string {
        return this.injectedData.cardinality;
    }

    protected getToken(): InjectionToken<string> {
        return XC_COMPONENT_DATA;
    }

    compact = true;

    tooltip: string;

    constructor(readonly injector: Injector, readonly i18n: I18nService) {
        super(injector);

        this.i18n.setTranslations(LocaleService.DE_DE, capacities_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, capacities_translations_en_US);

        const values: I18nParam[] = [
            {
                key: '%value0%',
                value: this.cardinality
            },
            {
                key: '%value1%',
                value: this.order
            }
        ];

        this.tooltip = i18n.translate('fman.capacities-usage-template.tooltip', ...values);
    }
}

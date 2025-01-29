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

import { tco_translations_de_DE } from '@fman/time-controlled-orders/locale/tco-translations.de-DE';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XC_COMPONENT_DATA, XcDynamicComponent } from '@zeta/xc';

import { tco_translations_en_US } from '../../locale/tco-translations.en-US';
import { TimeControlledOrderTableEntryTemplateData } from '../../xo/xo-time-controlled-order-table-entry.model';


@Component({
    selector: 'time-controlled-order-table-entry-template',
    template: `
        <i *ngIf="archived;else normal" xc-i18n xc-tooltip="tooltip-archived"><xc-icon color="normal" xc-icon-name="folder" xc-icon-material></xc-icon>{{id}}</i>
        <ng-template #normal>{{id}}</ng-template>
    `,
    styleUrls: ['./time-controlled-order-table-entry-template.component.scss'],
    standalone: false
})
export class TimeControlledOrderTableEntryTemplateComponent extends XcDynamicComponent<TimeControlledOrderTableEntryTemplateData> {
    get id(): string {
        return this.injectedData.id;
    }

    get archived(): boolean {
        return this.injectedData.archived;
    }

    constructor(readonly injector: Injector, readonly i18n: I18nService) {
        super(injector);

        this.i18n.setTranslations(LocaleService.DE_DE, tco_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, tco_translations_en_US);
    }

    protected getToken(): InjectionToken<string> {
        return XC_COMPONENT_DATA;
    }
}

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
import { Component, OnInit } from '@angular/core';

import { LocaleService } from '@zeta/i18n';

import { InputScreenWorkflowPackage, RestorableRouteComponent } from '../restorable-route.component';
import { capacities_translations_de_DE } from './locale/capacities-translations.de-DE';
import { capacities_translations_en_US } from './locale/capacities-translations.en-US';
import { XoCapacityInformation } from './xo/xo-capacity-information.model';


export interface CapacitiesInputScreenWorkflowPackage extends InputScreenWorkflowPackage {
    dummy?: string;
}


export const CAPACITY_ISWP: CapacitiesInputScreenWorkflowPackage = {
    List: 'xmcp.factorymanager.capacities.GetCapacities',
    Details: 'xmcp.factorymanager.capacities.GetCapacity',
    Add: 'xmcp.factorymanager.capacities.CreateCapacity',
    Save: 'xmcp.factorymanager.capacities.ChangeCapacity',
    Delete: 'xmcp.factorymanager.capacities.DeleteCapacity'
};


@Component({
    selector: 'restorable-capacities',
    template: ''
})
export class RestorableCapacitiesComponent extends RestorableRouteComponent<XoCapacityInformation> implements OnInit {

    get UNSPECIFIED_DETAILS_ERROR(): string {
        return this.i18nService.translateSignal('fman.restorable-capacities.unspecified-details-error')();
    }

    get UNSPECIFIED_ADD_ERROR(): string {
        return this.i18nService.translateSignal('fman.restorable-capacities.unspecified-add-error')();
    }

    get UNSPECIFIED_SAVE_ERROR(): string {
        return this.i18nService.translateSignal('fman.restorable-capacities.unspecified-save-error')();
    }

    get CONFIRM_DELETE(): string {
        return this.i18nService.translateSignal('fman.restorable-capacities.confirm-delete')();
    }

    constructor() {
        super();

        this.i18nService.setTranslations(LocaleService.DE_DE, capacities_translations_de_DE);
        this.i18nService.setTranslations(LocaleService.EN_US, capacities_translations_en_US);
    }

    ngOnInit() {
        super.ngOnInit();
    }

}

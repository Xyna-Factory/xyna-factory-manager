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
import { Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { FactoryManagerSettingsService } from '@fman/misc/services/factory-manager-settings.service';
import { ApiService } from '@zeta/api';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XcDialogService } from '@zeta/xc';

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

    protected UNSPECIFIED_DETAILS_ERROR = 'fman.restorable-capacities.unspecified-details-error';
    protected UNSPECIFIED_ADD_ERROR = 'fman.restorable-capacities.unspecified-add-error';
    protected UNSPECIFIED_SAVE_ERROR = 'fman.restorable-capacities.unspecified-save-error';
    protected CONFIRM_DELETE = 'fman.restorable-capacities.confirm-delete';

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

        this.i18nService.setTranslations(LocaleService.DE_DE, capacities_translations_de_DE);
        this.i18nService.setTranslations(LocaleService.EN_US, capacities_translations_en_US);
    }

    private translateConstants() {
        this.UNSPECIFIED_DETAILS_ERROR = this.i18nService.translate(this.UNSPECIFIED_DETAILS_ERROR);
        this.UNSPECIFIED_ADD_ERROR = this.i18nService.translate(this.UNSPECIFIED_ADD_ERROR);
        this.UNSPECIFIED_SAVE_ERROR = this.i18nService.translate(this.UNSPECIFIED_SAVE_ERROR);
        this.CONFIRM_DELETE = this.i18nService.translate(this.CONFIRM_DELETE);
    }

    ngOnInit() {
        super.ngOnInit();
        this.translateConstants();
    }

}

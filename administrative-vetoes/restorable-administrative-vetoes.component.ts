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
import { administrativeVetoes_translations_de_DE } from './locale/administrative-vetoes-translations.de-DE';
import { administrativeVetoes_translations_en_US } from './locale/administrative-vetoes-translations.en-US';
import { XoAdministrativeVeto } from './xo/xo-administrative-veto.model';


@Component({
    selector: 'restorable-administrative-veto',
    template: ''
})
export class RestorableAdministrativeVetoComponent extends RestorableRouteComponent<XoAdministrativeVeto> implements OnInit {
    protected UNSPECIFIED_DETAILS_ERROR = 'fman.restorable-administrative-vetoes.unspecified-details-error';
    protected UNSPECIFIED_ADD_ERROR = 'fman.restorable-administrative-vetoes.unspecified-add-error';
    protected UNSPECIFIED_SAVE_ERROR = 'fman.restorable-administrative-vetoes.unspecified-save-error';
    protected NAME_MUST_BE_UNIQUE_ERROR = 'fman.restorable-administrative-vetoes.name-must-be-unique-error';
    protected CONFIRM_DELETE = 'fman.administrative-vetoes.confirm-delete';

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

        this.i18nService.setTranslations(LocaleService.DE_DE, administrativeVetoes_translations_de_DE);
        this.i18nService.setTranslations(LocaleService.EN_US, administrativeVetoes_translations_en_US);
    }

    private translateConstants() {
        this.UNSPECIFIED_DETAILS_ERROR = this.i18nService.translate(this.UNSPECIFIED_DETAILS_ERROR);
        this.UNSPECIFIED_ADD_ERROR = this.i18nService.translate(this.UNSPECIFIED_ADD_ERROR);
        this.UNSPECIFIED_DETAILS_ERROR = this.i18nService.translate(this.UNSPECIFIED_SAVE_ERROR);
        this.UNSPECIFIED_DETAILS_ERROR = this.i18nService.translate(this.CONFIRM_DELETE);
    }

    ngOnInit() {
        super.ngOnInit();
        this.translateConstants();
    }

}


export interface AdministrativeVetoesScreenWorkflowPackage extends InputScreenWorkflowPackage {
    getSomething: string;
}

export const ADMINISTRATIVE_VETOES_ISWP: AdministrativeVetoesScreenWorkflowPackage = {
    List: 'xmcp.factorymanager.administrativevetoes.GetVetoes',
    Details: 'xmcp.factorymanager.administrativevetoes.GetVeto',
    Delete: 'xmcp.factorymanager.administrativevetoes.DeleteVeto',
    Add: 'xmcp.factorymanager.administrativevetoes.CreateVeto',
    Save: 'xmcp.factorymanager.administrativevetoes.ChangeVeto',
    getSomething: ''
};

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
import { ApiService } from '@zeta/api/api.service';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XcDialogService } from '@zeta/xc';

import { RestorableRouteComponent } from '../restorable-route.component';
import { tco_translations_de_DE } from './locale/tco-translations.de-DE';
import { tco_translations_en_US } from './locale/tco-translations.en-US';
import { XoTimeControlledOrderTableEntry } from './xo/xo-time-controlled-order-table-entry.model';


@Component({
    template: '',
    standalone: false
})
export class RestorableTimeControlledOrderComponent extends RestorableRouteComponent<XoTimeControlledOrderTableEntry> implements OnInit {

    readonly WFP_GET_TCO_DETAILS = 'xmcp.factorymanager.timecontrolledorders.GetTCODetails';
    readonly WFP_UPDATE_TCO = 'xmcp.factorymanager.timecontrolledorders.UpdateTCO';
    readonly WFP_GETTCOS = 'xmcp.factorymanager.timecontrolledorders.GetTCOs';
    readonly WFP_KILL_TCO = 'xmcp.factorymanager.timecontrolledorders.KillTCO';
    protected CONFIRM_KILL = 'fman.tco.confirm-delete';

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

        this.i18nService.setTranslations(LocaleService.DE_DE, tco_translations_de_DE);
        this.i18nService.setTranslations(LocaleService.EN_US, tco_translations_en_US);
    }

    ngOnInit() {
        super.ngOnInit();
    }
}

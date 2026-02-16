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
import { XoXynaProperty } from '@zeta/auth/xo/xyna-property.model';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XcDialogService } from '@zeta/xc';

import { InputScreenWorkflowPackage, RestorableRouteComponent } from '../restorable-route.component';
import { xyna_properties_translations_de_DE } from './locale/xyna-properties-translations.de-DE';
import { xyna_properties_translations_en_US } from './locale/xyna-properties-translations.en-US';


export interface XynaPropertiesInputScreenWorkflowPackage extends InputScreenWorkflowPackage {
    dummy?: string;
}


export const XYNA_PROPERTY_ISWP: XynaPropertiesInputScreenWorkflowPackage = {
    List : 'xmcp.factorymanager.xynaproperties.GetXynaPropertiesTableInfo',
    Details: 'xmcp.factorymanager.xynaproperties.GetXynaPropertyDetails',
    Add: 'xmcp.factorymanager.xynaproperties.CreateXynaProperty',
    Save: 'xmcp.factorymanager.xynaproperties.ChangeXynaProperty',
    Delete: 'xmcp.factorymanager.xynaproperties.RemoveXynaProperty'
};


@Component({
    template: ''
})
export class RestorableXynaPropertiesComponent extends RestorableRouteComponent<XoXynaProperty> implements OnInit {

    protected UNSPECIFIED_DETAILS_ERROR = 'fman.restorable-xyna-properties.unspecified-details-error';
    protected UNSPECIFIED_ADD_ERROR = 'fman.restorable-xyna-properties.unspecified-add-error';
    protected UNSPECIFIED_SAVE_ERROR = 'fman.restorable-xyna-properties.unspecified-save-error';
    protected CONFIRM_DELETE = 'fman.restorable-xyna-properties.confirm-delete';
    protected CONFIRM_RESTORE = 'fman.restorable-xyna-properties.confirm-restore';

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

        this.i18nService.setTranslations(LocaleService.DE_DE, xyna_properties_translations_de_DE);
        this.i18nService.setTranslations(LocaleService.EN_US, xyna_properties_translations_en_US);
    }

    private translateConstants() {
        this.UNSPECIFIED_DETAILS_ERROR = this.i18nService.translate(this.UNSPECIFIED_DETAILS_ERROR);
        this.UNSPECIFIED_ADD_ERROR = this.i18nService.translate(this.UNSPECIFIED_ADD_ERROR);
        this.UNSPECIFIED_DETAILS_ERROR = this.i18nService.translate(this.UNSPECIFIED_SAVE_ERROR);
    }

    ngOnInit() {
        super.ngOnInit();
        this.translateConstants();
    }

}

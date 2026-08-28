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

import { XoXynaProperty } from '@zeta/auth/xo/xyna-property.model';
import { LocaleService } from '@zeta/i18n';

import { InputScreenWorkflowPackage, RestorableRouteComponent } from '../restorable-route.component';
import { xyna_properties_translations_de_DE } from './locale/xyna-properties-translations.de-DE';
import { xyna_properties_translations_en_US } from './locale/xyna-properties-translations.en-US';


export interface XynaPropertiesInputScreenWorkflowPackage extends InputScreenWorkflowPackage {
    dummy?: string;
    Import: string;
    Export: string;
}


export const XYNA_PROPERTY_ISWP: XynaPropertiesInputScreenWorkflowPackage = {
    List : 'xmcp.factorymanager.xynaproperties.GetXynaPropertiesTableInfo',
    Details: 'xmcp.factorymanager.xynaproperties.GetXynaPropertyDetails',
    Add: 'xmcp.factorymanager.xynaproperties.CreateXynaProperty',
    Save: 'xmcp.factorymanager.xynaproperties.ChangeXynaProperty',
    Delete: 'xmcp.factorymanager.xynaproperties.RemoveXynaProperty',
    Import: 'xmcp.factorymanager.xynaproperties.ImportXynaProperties',
    Export: 'xmcp.factorymanager.xynaproperties.ExportPropertiesToFile'
};


export enum XynaPropertiesFormat {
    CSV = 'CSV',
    YAML = 'YAML'
}

@Component({
    template: ''
})
export class RestorableXynaPropertiesComponent extends RestorableRouteComponent<XoXynaProperty> implements OnInit {

    get UNSPECIFIED_DETAILS_ERROR(): string {
        return this.i18nService.translateSignal('fman.restorable-xyna-properties.unspecified-details-error')();
    }

    get UNSPECIFIED_ADD_ERROR(): string {
        return this.i18nService.translateSignal('fman.restorable-xyna-properties.unspecified-add-error')();
    }

    get UNSPECIFIED_SAVE_ERROR(): string {
        return this.i18nService.translateSignal('fman.restorable-xyna-properties.unspecified-save-error')();
    }

    get CONFIRM_DELETE(): string {
        return this.i18nService.translateSignal('fman.restorable-xyna-properties.confirm-delete')();
    }

    get CONFIRM_RESTORE(): string {
        return this.i18nService.translateSignal('fman.restorable-xyna-properties.confirm-restore')();
    }

    constructor() {
        super();

        this.i18nService.setTranslations(LocaleService.DE_DE, xyna_properties_translations_de_DE);
        this.i18nService.setTranslations(LocaleService.EN_US, xyna_properties_translations_en_US);
    }

    ngOnInit() {
        super.ngOnInit();
    }

}

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
import { Component } from '@angular/core';

import { AuthService } from '@zeta/auth';
import { I18nService, LocaleService } from '@zeta/i18n';
import { RouteComponent } from '@zeta/nav';
import { XcNavListItem, XcNavListOrientation } from '@zeta/xc';
import { filter } from 'rxjs';

import { RIGHT_FACTORY_MANAGER_ADMINISTRATIVE_VETOES, RIGHT_FACTORY_MANAGER_CAPACITIES, RIGHT_FACTORY_MANAGER_DEPLOYMENT_ITEMS, RIGHT_FACTORY_MANAGER_FILTER, RIGHT_FACTORY_MANAGER_ORDER_INPUT_SOURCES, RIGHT_FACTORY_MANAGER_ORDER_TYPES, RIGHT_FACTORY_MANAGER_STORABLE_INSTANCES, RIGHT_FACTORY_MANAGER_TIME_CONTROLLED_ORDERS, RIGHT_FACTORY_MANAGER_TRIGGER, RIGHT_FACTORY_MANAGER_WORKSPACES_AND_APPLICATIONS, RIGHT_FACTORY_MANAGER_XYNA_PROPERTIES } from './const';
import { fman_error_code_translations_de_DE } from './locale/fman-error-code-translations.de-DE';
import { fman_error_code_translations_en_US } from './locale/fman-error-code-translations.en-US';
import { fman_translations_de_DE } from './locale/fman-translations.de-DE';
import { fman_translations_en_US } from './locale/fman-translations.en-US';
import { PluginService } from './plugin/plugin.service';


interface XcRighteousNavListItem extends XcNavListItem {
    right?: string;
}


@Component({
    templateUrl: './factory-manager.component.html',
    styleUrls: ['./factory-manager.component.scss'],
    standalone: false
})
export class FactoryManagerComponent extends RouteComponent {

    private readonly _fmNames = {
        WORKSPACES: 'Workspaces',
        APPLICATIONS: 'Applications',
        TRIGGER: 'Trigger',
        FILTER: 'Filter',
        ORDERTYPES: 'Order Types',
        CRONLIKE_ORDRES: 'Cron-like Orders',
        TIMECONTROLLED_ORDERS: 'Time-Controlled Orders',
        ORDER_INPUT_SOURCES: 'Order Input Sources',
        CAPACITIES: 'Capacities',
        ADMINISTRATIVE_VETOES: 'Administrative Vetoes',
        DEPLOYMENT_ITEMS: 'Deployment Items',
        STORABLE_INSTANCES: 'Storable Instances',
        DATA_MODELS: 'Data Models',
        XYNA_PROPERTIES: 'Xyna Properties'
    };

    navListItems: XcRighteousNavListItem[] = [
        { name: this._fmNames.WORKSPACES, link: 'workspaces', right: RIGHT_FACTORY_MANAGER_WORKSPACES_AND_APPLICATIONS },
        { name: this._fmNames.APPLICATIONS, link: 'applications', right: RIGHT_FACTORY_MANAGER_WORKSPACES_AND_APPLICATIONS },
        { name: this._fmNames.TRIGGER, link: 'trigger', right: RIGHT_FACTORY_MANAGER_TRIGGER },
        { name: this._fmNames.FILTER, link: 'filter', right: RIGHT_FACTORY_MANAGER_FILTER },
        { name: this._fmNames.ORDERTYPES, link: 'ordertypes', right: RIGHT_FACTORY_MANAGER_ORDER_TYPES },
        { name: this._fmNames.CRONLIKE_ORDRES, link: 'cron-like-orders', right: RIGHT_FACTORY_MANAGER_WORKSPACES_AND_APPLICATIONS },
        { name: this._fmNames.TIMECONTROLLED_ORDERS, link: 'time-controlled-orders', right: RIGHT_FACTORY_MANAGER_TIME_CONTROLLED_ORDERS },
        { name: this._fmNames.ORDER_INPUT_SOURCES, link: 'order-input-sources', right: RIGHT_FACTORY_MANAGER_ORDER_INPUT_SOURCES },
        { name: this._fmNames.CAPACITIES, link: 'capacities', right: RIGHT_FACTORY_MANAGER_CAPACITIES },
        { name: this._fmNames.ADMINISTRATIVE_VETOES, link: 'administrative-vetoes', right: RIGHT_FACTORY_MANAGER_ADMINISTRATIVE_VETOES },
        { name: this._fmNames.DEPLOYMENT_ITEMS, link: 'deployment-items', right: RIGHT_FACTORY_MANAGER_DEPLOYMENT_ITEMS },
        { name: this._fmNames.STORABLE_INSTANCES, link: 'storable-instances', right: RIGHT_FACTORY_MANAGER_STORABLE_INSTANCES },
        // { name: this._fmNames.DATA_MODELS, link: 'data-models', disabled: true, right: RIGHT_FACTORY_MANAGER_DATA_MODELS },
        { name: this._fmNames.XYNA_PROPERTIES, link: 'xyna-properties', right: RIGHT_FACTORY_MANAGER_XYNA_PROPERTIES }
    ];

    navListOrientation = XcNavListOrientation.LEFT;

    constructor(private readonly i18n: I18nService, authService: AuthService, pluginService: PluginService) {
        super();

        this.i18n.contextDismantlingSearch = true;
        this.i18n.setTranslations(LocaleService.DE_DE, fman_translations_de_DE);
        this.i18n.setTranslations(LocaleService.DE_DE, fman_error_code_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, fman_translations_en_US);
        this.i18n.setTranslations(LocaleService.EN_US, fman_error_code_translations_en_US);


        this.navListItems.forEach(item => {
            item.disabled = item.disabled || !!item.right && !authService.hasRight(item.right);
            item.name = i18n.translate(item.name);
        });


        // add items for plugins
        pluginService.plugins.pipe(filter(plugins => !!plugins)).subscribe(plugins => {

            for (const [link, plugin] of plugins) {
                this.navListItems.push(
                    { name: plugin.navigationEntryLabel, link: link }
                );
            }
            // let entry = plugins.entries().next();
            // while (entry) {
            //     this.navListItems.push(
            //         { name: (entry.value[0] as XoPlugin).navigationEntryLabel, link: entry.value[1] }
            //     );
            //     entry = plugins.entries().next();
            // }
        });
    }
}

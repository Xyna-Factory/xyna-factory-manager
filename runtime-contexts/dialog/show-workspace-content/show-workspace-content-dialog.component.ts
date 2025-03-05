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

import { XoGetWorkspaceContentRequest } from '@fman/runtime-contexts/xo/xo-get-workspace-content-request.model';
import { ApiService } from '@zeta/api';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XcDialogComponent, XcRemoteTableDataSource } from '@zeta/xc';

import { FM_RTC } from '../../../const';
import { FactoryManagerSettingsService } from '../../../misc/services/factory-manager-settings.service';
import { createContentTableInfoClass } from '../../content';
import { ORDER_TYPES } from '../../order-types';
import { XoApplicationElement } from '../../xo/xo-application-element.model';
import { XoRuntimeContext } from '../../xo/xo-runtime-context.model';
import { showWorkspaceContent_translations_de_DE } from './locale/show-workspace-content-translations.de-DE';
import { showWorkspaceContent_translations_en_US } from './locale/show-workspace-content-translations.en-US';


@Component({
    templateUrl: './show-workspace-content-dialog.component.html',
    styleUrls: ['./show-workspace-content-dialog.component.scss'],
    standalone: false
})
export class ShowWorkspaceContentDialogComponent extends XcDialogComponent<boolean, XoRuntimeContext> {

    dataSource: XcRemoteTableDataSource<XoApplicationElement>;
    onlyUnassigned = false;


    constructor(injector: Injector, private readonly apiService: ApiService, private readonly i18n: I18nService, private readonly settings: FactoryManagerSettingsService) {
        super(injector);

        this.i18n.setTranslations(LocaleService.EN_US, showWorkspaceContent_translations_en_US);
        this.i18n.setTranslations(LocaleService.DE_DE, showWorkspaceContent_translations_de_DE);

        // create data source
        this.dataSource = new XcRemoteTableDataSource(this.apiService, undefined, FM_RTC, ORDER_TYPES.GET_WORKSPACE_CONTENT, createContentTableInfoClass(false));
        this.updateDataSource();
    }


    updateDataSource() {
        this.dataSource.input = XoGetWorkspaceContentRequest.create(this.injectedData, this.onlyUnassigned);
        this.dataSource.refreshOnFilterChange = this.settings.tableRefreshOnFilterChange;
        this.dataSource.refresh();
    }
}

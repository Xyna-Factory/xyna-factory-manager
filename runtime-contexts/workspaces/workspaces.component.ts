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
import { AfterViewInit, Component, OnDestroy, QueryList, ViewChildren } from '@angular/core';

import { FactoryManagerSettingsService } from '@fman/misc/services/factory-manager-settings.service';
import { ApiService } from '@zeta/api';
import { I18nService, LocaleService } from '@zeta/i18n';
import { RouteComponent } from '@zeta/nav';
import { XcDialogService, XcRemoteDataSource, XcSortDirection, XcSortPredicate } from '@zeta/xc';

import { Subscription } from 'rxjs';

import { FM_RTC } from '../../const';
import { CreateWorkspaceDialogComponent } from '../dialog/create-workspace/create-workspace-dialog.component';
import { MigrateWizardComponent, MigrationWizardData } from '../dialog/migrate-wizard/migrate-wizard.component';
import { runtime_contexts_translations_de_DE } from '../locale/runtime-contexts-translations.de-DE';
import { runtime_contexts_translations_en_US } from '../locale/runtime-contexts-translations.en-US';
import { ORDER_TYPES } from '../order-types';
import { XoApplicationDefinitionDetails } from '../xo/xo-application-definition-details.model';
import { XoApplicationDefinition } from '../xo/xo-application-definition.model';
import { XoRuntimeContext } from '../xo/xo-runtime-context.model';
import { XoWorkspaceDetails } from '../xo/xo-workspace-details.model';
import { XoWorkspace, XoWorkspaceArray } from '../xo/xo-workspace.model';
import { WorkspaceTileComponent } from './workspace-tile/workspace-tile.component';


@Component({
    templateUrl: './workspaces.component.html',
    styleUrls: ['./workspaces.component.scss'],
    standalone: false
})
export class WorkspacesComponent extends RouteComponent implements AfterViewInit, OnDestroy {

    private readonly remoteDataSource: XcRemoteDataSource<XoWorkspace>;
    private detailsObject: XoWorkspaceDetails | XoApplicationDefinitionDetails;
    private markedForRefresh = false;
    private workspaceTilesSubscription: Subscription;
    private _filterText: string;

    filteredWorkspaces: XoWorkspace[];

    @ViewChildren('workspaceTiles')
    workspaceTiles: QueryList<any>;


    constructor(
        private readonly i18n: I18nService,
        private readonly apiService: ApiService,
        private readonly dialogService: XcDialogService,
        private readonly settings: FactoryManagerSettingsService
    ) {
        super();

        this.remoteDataSource = new XcRemoteDataSource(this.apiService, FM_RTC, ORDER_TYPES.GET_WORKSPACES, undefined, XoWorkspaceArray);
        this.remoteDataSource.compareFn = XcSortPredicate(XcSortDirection.asc, t => t.name.toLowerCase());
        this.remoteDataSource.dataChange.subscribe(() => this.filter());
        this.refresh();

        this.i18n.setTranslations(LocaleService.DE_DE, runtime_contexts_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, runtime_contexts_translations_en_US);
    }


    ngAfterViewInit() {
        this.workspaceTilesSubscription = this.workspaceTiles.changes.subscribe(list => {
            if (list?.length > 0 && this.detailsObject) {
                list._results.forEach((component: WorkspaceTileComponent) => {
                    if (component.hasDetails) {
                        component.scrollTo();
                    }
                });
            }
        });
    }


    ngOnDestroy() {
        this.workspaceTilesSubscription?.unsubscribe();
    }


    filter() {
        this.filteredWorkspaces = this.filterText
            ? this.remoteDataSource.rawData.filter(workspace =>
                workspace.name.includes(this.filterText) ||
                workspace.applicationDefinitions.data.some(applicationDefinition => applicationDefinition.title.includes(this.filterText))
            )
            : this.remoteDataSource.rawData;

        if (this.filterText) {
            const text = this.filterText.toLowerCase();
            this.filteredWorkspaces = this.remoteDataSource.rawData.filter(workspace =>
                workspace.name.toLowerCase().includes(text) ||
                workspace.applicationDefinitions.data.some(applicationDefinition => applicationDefinition.title.toLowerCase().includes(text))
            );
        } else {
            this.filteredWorkspaces = this.remoteDataSource.rawData;
        }
    }


    set filterText(value: string) {
        if (this.filterText !== value) {
            this._filterText = value;
            if (this.settings.tableRefreshOnFilterChange) {
                this.filter();
            }
        }
    }


    get filterText(): string {
        return this._filterText;
    }


    refresh() {
        this.remoteDataSource.refresh();
        this.markedForRefresh = true;
    }


    needsRefresh(workspace: XoWorkspace) {
        return this.remoteDataSource.selectionModel.selection[0] === workspace && this.markedForRefresh;
    }


    startMigration() {
        this.dialogService.custom(MigrateWizardComponent, <MigrationWizardData>{i18n: this.i18n, rtc: FM_RTC, apiService: this.apiService});
    }


    select(workspace: XoWorkspace) {
        this.remoteDataSource.selectionModel.clear();
        if (workspace) {
            this.remoteDataSource.selectionModel.select(workspace);
        }
    }


    selectDetails(runtimeContext: XoRuntimeContext) {
        this.detailsObject = null;
        if (runtimeContext instanceof XoWorkspace) {
            this.apiService.startOrderAssert<XoWorkspaceDetails>(FM_RTC, ORDER_TYPES.GET_WORKSPACE_DETAILS, runtimeContext.proxy(), XoWorkspaceDetails, null).subscribe(
                workspaceDetails => this.detailsObject = workspaceDetails
            );
        }
        if (runtimeContext instanceof XoApplicationDefinition) {
            this.apiService.startOrderAssert<XoApplicationDefinitionDetails>(FM_RTC, ORDER_TYPES.GET_APPLICATION_DEFINITION_DETAILS, runtimeContext.proxy(), XoApplicationDefinitionDetails, null).subscribe(
                applicationDefinitionDetails => this.detailsObject = applicationDefinitionDetails
            );
        }
    }


    get refreshing(): boolean {
        return this.remoteDataSource.refreshing;
    }


    get selection(): XoWorkspace {
        return this.remoteDataSource.selectionModel.selection[0];
    }


    get details(): XoWorkspaceDetails | XoApplicationDefinitionDetails {
        return this.detailsObject;
    }


    get workspaces(): XoWorkspace[] {
        return !this.refreshing
            ? this.filteredWorkspaces
            : [];
    }


    createWorkspace() {
        this.dialogService.custom(CreateWorkspaceDialogComponent).afterDismissResult().subscribe(
            () => this.refresh()
        );
    }
}

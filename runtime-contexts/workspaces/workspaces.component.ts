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

import { Subscription } from 'rxjs';

import { AfterViewInit, ChangeDetectionStrategy, Component, computed, effect, inject, OnDestroy, signal, viewChildren } from '@angular/core';
import { FMAN_RTC } from '@fman/factory-manager.component';
import { ApiService } from '@zeta/api';
import { I18nService, LocaleService, XcI18nContextDirective, XcI18nTranslateDirective } from '@zeta/i18n';
import { RouteComponent } from '@zeta/nav';
import { XcButtonComponent, XcDialogService, XcFormInputComponent, XcIconButtonComponent, XcIconComponent, XcPanelComponent, XcRemoteDataSource, XcSortDirection, XcSortPredicate, XcSpinnerComponent, XcTooltipDirective } from '@zeta/xc';

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
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './workspaces.component.html',
    styleUrls: ['./workspaces.component.scss'],
    imports: [XcButtonComponent, XcFormInputComponent, XcIconButtonComponent, XcIconComponent, XcPanelComponent, XcSpinnerComponent, XcTooltipDirective, XcI18nContextDirective, XcI18nTranslateDirective, WorkspaceTileComponent]
})
export class WorkspacesComponent extends RouteComponent implements AfterViewInit, OnDestroy {
    private readonly i18n = inject(I18nService);
    private readonly apiService = inject(ApiService);
    private readonly dialogService = inject(XcDialogService);


    private readonly remoteDataSource: XcRemoteDataSource<XoWorkspace>;
    private readonly dataVersion = signal(0);
    private readonly selectedWorkspace = signal<XoWorkspace | undefined>(undefined);
    private readonly selectedDetails = signal<XoWorkspaceDetails | XoApplicationDefinitionDetails | undefined>(undefined);
    private readonly refreshingState = signal(false);
    private readonly markedForRefresh = signal(false);
    private readonly filterTextState = signal('');
    readonly workspacesList = computed(() => {
        this.dataVersion();
        const text = this.filterTextState().toLowerCase();
        const rawData = this.remoteDataSource.rawData;
        return text
            ? rawData.filter(workspace =>
                workspace.name.toLowerCase().includes(text) ||
                workspace.applicationDefinitions.data.some(applicationDefinition => applicationDefinition.title.toLowerCase().includes(text))
            )
            : rawData;
    });

    readonly workspaceTiles = viewChildren<any>('workspaceTiles');


    constructor() {
        super();

        effect(() => {
            const tiles = this.workspaceTiles();
            if (tiles.length > 0 && this.selectedDetails()) {
                tiles.forEach((component: WorkspaceTileComponent) => {
                    if (component.hasDetails) {
                        component.scrollTo();
                    }
                });
            }
        });

        this.remoteDataSource = new XcRemoteDataSource(this.apiService, FMAN_RTC, ORDER_TYPES.GET_WORKSPACES, undefined, XoWorkspaceArray);
        this.remoteDataSource.compareFn = XcSortPredicate(XcSortDirection.asc, t => t.name.toLowerCase());
        this.remoteDataSource.dataChange.subscribe(() => {
            this.dataVersion.update(value => value + 1);
            this.refreshingState.set(false);
            this.markedForRefresh.set(false);
        });
        this.refresh();

        this.i18n.setTranslations(LocaleService.DE_DE, runtime_contexts_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, runtime_contexts_translations_en_US);
    }


    ngAfterViewInit() {
    }


    ngOnDestroy() {
    }


    filter() {
        this.dataVersion.update(value => value + 1);
    }


    set filterText(value: string) {
        if (this.filterText !== value) {
            this.filterTextState.set(value);
        }
    }


    get filterText(): string {
        return this.filterTextState();
    }


    refresh() {
        this.refreshingState.set(true);
        this.remoteDataSource.refresh();
        this.markedForRefresh.set(true);
    }


    needsRefresh(workspace: XoWorkspace) {
        return this.selectedWorkspace() === workspace && this.markedForRefresh();
    }


    startMigration() {
        this.dialogService.custom(MigrateWizardComponent, <MigrationWizardData>{i18n: this.i18n, rtc: FMAN_RTC, apiService: this.apiService});
    }


    select(workspace: XoWorkspace) {
        this.remoteDataSource.selectionModel.clear();
        this.selectedWorkspace.set(workspace);
        if (workspace) {
            this.remoteDataSource.selectionModel.select(workspace);
        }
    }


    selectDetails(runtimeContext: XoRuntimeContext) {
        this.selectedDetails.set(undefined);
        if (runtimeContext instanceof XoWorkspace) {
            this.apiService.startOrderAssert<XoWorkspaceDetails>(FMAN_RTC, ORDER_TYPES.GET_WORKSPACE_DETAILS, runtimeContext.proxy(), XoWorkspaceDetails, null).subscribe(
                workspaceDetails => this.selectedDetails.set(workspaceDetails)
            );
        }
        if (runtimeContext instanceof XoApplicationDefinition) {
            this.apiService.startOrderAssert<XoApplicationDefinitionDetails>(FMAN_RTC, ORDER_TYPES.GET_APPLICATION_DEFINITION_DETAILS, runtimeContext.proxy(), XoApplicationDefinitionDetails, null).subscribe(
                applicationDefinitionDetails => this.selectedDetails.set(applicationDefinitionDetails)
            );
        }
    }


    get refreshing(): boolean {
        return this.refreshingState();
    }


    get selection(): XoWorkspace {
        return this.selectedWorkspace()!;
    }


    get details(): XoWorkspaceDetails | XoApplicationDefinitionDetails {
        return this.selectedDetails()!;
    }


    get workspaces(): XoWorkspace[] {
        return this.workspacesList();
    }


    createWorkspace() {
        this.dialogService.custom(CreateWorkspaceDialogComponent).afterDismissResult().subscribe(
            () => this.refresh()
        );
    }
}

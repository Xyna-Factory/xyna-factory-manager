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
import { AfterViewInit, ChangeDetectionStrategy, Component, computed, inject, OnDestroy, QueryList, signal, ViewChildren } from '@angular/core';

import { ApiService, StartOrderOptionsBuilder } from '@zeta/api';
import { I18nService, LocaleService, XcI18nContextDirective, XcI18nTranslateDirective } from '@zeta/i18n';
import { RouteComponent } from '@zeta/nav';
import { XcButtonComponent, XcDialogService, XcFormInputComponent, XcIconButtonComponent, XcIconComponent, XcPanelComponent, XcSpinnerComponent, XcTooltipDirective } from '@zeta/xc';

import { Subscription } from 'rxjs';

import { CreateRuntimeApplicationDialogComponent } from '../dialog/create-runtime-application/create-runtime-application-dialog.component';
import { ImportRuntimeApplicationDialogComponent } from '../dialog/import-runtime-application/import-runtime-application-dialog.component';
import { MigrateWizardComponent, MigrationWizardData } from '../dialog/migrate-wizard/migrate-wizard.component';
import { runtime_contexts_translations_de_DE } from '../locale/runtime-contexts-translations.de-DE';
import { runtime_contexts_translations_en_US } from '../locale/runtime-contexts-translations.en-US';
import { ORDER_TYPES } from '../order-types';
import { XoRuntimeApplicationDetails } from '../xo/xo-runtime-application-details.model';
import { XoRuntimeApplication, XoRuntimeApplicationArray } from '../xo/xo-runtime-application.model';
import { Application, ApplicationDataSource } from './application-data-source';
import { ApplicationTileComponent } from './application-tile/application-tile.component';
import { FMAN_RTC } from '@fman/factory-manager.component';


@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './applications.component.html',
    styleUrls: ['./applications.component.scss'],
    imports: [XcButtonComponent, XcFormInputComponent, XcIconButtonComponent, XcIconComponent, XcPanelComponent, XcSpinnerComponent, XcTooltipDirective, XcI18nContextDirective, XcI18nTranslateDirective, ApplicationTileComponent]
})
export class ApplicationsComponent extends RouteComponent implements OnDestroy, AfterViewInit {
    private readonly i18n = inject(I18nService);
    private readonly apiService = inject(ApiService);
    private readonly dialogService = inject(XcDialogService);


    private readonly dataSource: ApplicationDataSource;
    private readonly dataVersion = signal(0);
    private readonly selectedApplication = signal<Application | undefined>(undefined);
    private readonly selectedDetails = signal<XoRuntimeApplicationDetails | undefined>(undefined);
    private readonly refreshingState = signal(false);
    private readonly markedForRefresh = signal(false);
    private applicationTilesSubscription: Subscription;
    private readonly filterTextState = signal('');
    readonly applicationsList = computed(() => {
        this.dataVersion();
        const text = this.filterTextState().toLowerCase();
        const rawData = this.dataSource.rawData;
        return text
            ? rawData.filter(application =>
                application.name.toLowerCase().includes(text) ||
                application.runtimeApplications.some(runtimeApplication => runtimeApplication.title.toLowerCase().includes(text))
            )
            : rawData;
    });

    @ViewChildren('applicationTiles')
    applicationTiles: QueryList<any>;


    constructor() {
        super();

        this.dataSource = new ApplicationDataSource(this.apiService, FMAN_RTC, ORDER_TYPES.GET_RUNTIME_APPLICATIONS, undefined, XoRuntimeApplicationArray);
        this.dataSource.dataChange.subscribe(() => {
            this.dataVersion.update(value => value + 1);
            this.refreshingState.set(false);
            this.markedForRefresh.set(false);
        });
        this.refresh();

        this.i18n.setTranslations(LocaleService.DE_DE, runtime_contexts_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, runtime_contexts_translations_en_US);
    }


    ngAfterViewInit() {
        this.applicationTilesSubscription = this.applicationTiles.changes.subscribe(t => {
            if (t && t.length !== 0) {
                if (this.selectedDetails()) {
                    t._results.forEach((component: ApplicationTileComponent) => {
                        if (component.hasDetails) {
                            component.scrollTo();
                        }
                    });
                }
            }
        });
    }


    ngOnDestroy() {
        this.applicationTilesSubscription.unsubscribe();
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
        this.dataSource.refresh();
        this.markedForRefresh.set(true);
    }


    needsRefresh(application: Application) {
        return this.selectedApplication() === application && this.markedForRefresh();
    }


    select(application: Application) {
        this.dataSource.selectionModel.clear();
        this.selectedApplication.set(application);
        if (application) {
            this.dataSource.selectionModel.select(application);
        }
    }


    selectDetails(runtimeApplication: XoRuntimeApplication) {
        this.selectedDetails.set(undefined);
        if (runtimeApplication) {
            this.apiService.startOrder(
                FMAN_RTC,
                ORDER_TYPES.GET_RUNTIME_APPLICATION_DETAILS,
                runtimeApplication.proxy(),
                XoRuntimeApplicationDetails,
                StartOrderOptionsBuilder.defaultOptionsWithErrorMessage
            ).subscribe(result => {
                if (result.errorMessage) {
                    this.dialogService.error(result.errorMessage, 'Error', result.stackTrace.join('\r\n'));
                } else {
                    this.selectedDetails.set(result.output[0] as XoRuntimeApplicationDetails);
                }
            });
        }
    }


    startMigration() {
        this.dialogService.custom(MigrateWizardComponent, <MigrationWizardData>{i18n: this.i18n, rtc: FMAN_RTC, apiService: this.apiService});
    }


    get refreshing(): boolean {
        return this.refreshingState();
    }


    get selection(): Application {
        return this.selectedApplication()!;
    }


    get details(): XoRuntimeApplicationDetails {
        return this.selectedDetails()!;
    }


    get applications(): Application[] {
        return this.applicationsList();
    }


    createRuntimeApplication() {
        this.dialogService.custom(CreateRuntimeApplicationDialogComponent, {workspaceName: undefined, applicationDefinitionName: undefined}).afterDismissResult().subscribe(
            () => this.refresh()
        );
    }


    importApplication() {
        this.dialogService.custom(ImportRuntimeApplicationDialogComponent).afterDismissResult().subscribe(
            () => this.refresh()
        );
    }
}

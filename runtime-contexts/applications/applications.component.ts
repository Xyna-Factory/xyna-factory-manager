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
import { ApiService, StartOrderOptionsBuilder } from '@zeta/api';
import { I18nService, LocaleService } from '@zeta/i18n';
import { RouteComponent } from '@zeta/nav';
import { XcDialogService } from '@zeta/xc';

import { Subscription } from 'rxjs';

import { FM_RTC } from '../../const';
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


@Component({
    templateUrl: './applications.component.html',
    styleUrls: ['./applications.component.scss'],
    standalone: false
})
export class ApplicationsComponent extends RouteComponent implements OnDestroy, AfterViewInit {

    private readonly dataSource: ApplicationDataSource;
    private detailsObject: XoRuntimeApplicationDetails;
    private markedForRefresh = false;
    private applicationTilesSubscription: Subscription;
    private _filterText: string;

    filteredApplications: Application[];

    @ViewChildren('applicationTiles')
    applicationTiles: QueryList<any>;


    constructor(
        private readonly i18n: I18nService,
        private readonly apiService: ApiService,
        private readonly dialogService: XcDialogService,
        private readonly settings: FactoryManagerSettingsService
    ) {
        super();

        this.dataSource = new ApplicationDataSource(this.apiService, FM_RTC, ORDER_TYPES.GET_RUNTIME_APPLICATIONS, undefined, XoRuntimeApplicationArray);
        this.dataSource.dataChange.subscribe(() => this.filter());
        this.refresh();

        this.i18n.setTranslations(LocaleService.DE_DE, runtime_contexts_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, runtime_contexts_translations_en_US);
    }


    ngAfterViewInit() {
        this.applicationTilesSubscription = this.applicationTiles.changes.subscribe(t => {
            if (t && t.length !== 0) {
                if (this.detailsObject) {
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
        if (this.filterText) {
            const text = this.filterText.toLowerCase();
            this.filteredApplications = this.dataSource.rawData.filter(application =>
                application.name.toLowerCase().includes(text) ||
                application.runtimeApplications.some(runtimeApplication => runtimeApplication.title.toLowerCase().includes(text))
            );
        } else {
            this.filteredApplications = this.dataSource.rawData;
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
        this.dataSource.refresh();
        this.markedForRefresh = true;
    }


    needsRefresh(application: Application) {
        return this.dataSource.selectionModel.selection[0] === application && this.markedForRefresh;
    }


    select(application: Application) {
        this.dataSource.selectionModel.clear();
        if (application) {
            this.dataSource.selectionModel.select(application);
        }
    }


    selectDetails(runtimeApplication: XoRuntimeApplication) {
        this.detailsObject = null;
        if (runtimeApplication) {
            this.apiService.startOrder(
                FM_RTC,
                ORDER_TYPES.GET_RUNTIME_APPLICATION_DETAILS,
                runtimeApplication.proxy(),
                XoRuntimeApplicationDetails,
                StartOrderOptionsBuilder.defaultOptionsWithErrorMessage
            ).subscribe(result => {
                if (result.errorMessage) {
                    this.dialogService.error(result.errorMessage, 'Error', result.stackTrace.join('\r\n'));
                } else {
                    this.detailsObject = result.output[0] as XoRuntimeApplicationDetails;
                }
            });
        }
    }


    startMigration() {
        this.dialogService.custom(MigrateWizardComponent, <MigrationWizardData>{i18n: this.i18n, rtc: FM_RTC, apiService: this.apiService});
    }


    get refreshing(): boolean {
        return this.dataSource.refreshing;
    }


    get selection(): Application {
        return this.dataSource.selectionModel.selection[0];
    }


    get details(): XoRuntimeApplicationDetails {
        return this.detailsObject;
    }


    get applications(): Application[] {
        return !this.refreshing
            ? this.filteredApplications
            : [];
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

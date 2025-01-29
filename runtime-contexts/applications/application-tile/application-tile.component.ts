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
import { Component, ElementRef, EventEmitter, HostBinding, Input, NgZone, OnInit, Output, ViewChild } from '@angular/core';

import { ExportApplicationDialogComponent } from '@fman/runtime-contexts/dialog/export-application/export-application-dialog.component';
import { XoGetApplicationContentRequest } from '@fman/runtime-contexts/xo/xo-get-application-content-request.model';
import { ApiService, StartOrderOptionsBuilder } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcDialogService, XcRemoteTableDataSource, XDSIconName } from '@zeta/xc';

import { debounceTime, filter, first, skip } from 'rxjs/operators';

import { FM_RTC } from '../../../const';
import { FactoryManagerSettingsService } from '../../../misc/services/factory-manager-settings.service';
import { createContentTableInfoClass } from '../../content';
import { createDependenciesTableInfoClass, createDependenciesTableInput, createFilterEnumOfState } from '../../dependencies';
import { DeleteRuntimeApplicationDialogComponent } from '../../dialog/delete-runtime-application/delete-runtime-application-dialog.component';
import { LoadRuntimeApplicationDialogComponent } from '../../dialog/load-runtime-application/load-runtime-application-dialog.component';
import { ManageContentDialogComponent } from '../../dialog/manage-content/manage-content-dialog.component';
import { ManageDependenciesDialogComponent } from '../../dialog/manage-dependencies/manage-dependencies-dialog.component';
import { MigrateWizardComponent, MigrationWizardData } from '../../dialog/migrate-wizard/migrate-wizard.component';
import { ORDER_TYPES } from '../../order-types';
import { XoApplicationElementArray } from '../../xo/xo-application-element.model';
import { XoDependency, XoDependencyArray } from '../../xo/xo-dependency.model';
import { XoIssue, XoIssueArray } from '../../xo/xo-issue.model';
import { XoOrderEntry } from '../../xo/xo-order-entry.model';
import { XoReferenceDirectionBackwards } from '../../xo/xo-reference-direction-backwards.model';
import { XoReferenceDirectionForward } from '../../xo/xo-reference-direction-forward.model';
import { XoRuntimeApplicationDetails } from '../../xo/xo-runtime-application-details.model';
import { XoRuntimeApplication } from '../../xo/xo-runtime-application.model';
import { XoRuntimeContextState } from '../../xo/xo-runtime-context-state.model';
import { XoRuntimeContext } from '../../xo/xo-runtime-context.model';
import { Application } from '../application-data-source';


@Component({
    selector: 'application-tile',
    templateUrl: './application-tile.component.html',
    styleUrls: ['./application-tile.component.scss'],
    standalone: false
})
export class ApplicationTileComponent implements OnInit {
    @ViewChild('header', {static: false})
    headerRef: ElementRef;

    readonly XDSIconName = XDSIconName;

    @Input()
    application: Application;

    @Input()
    selection: Application;

    @Input()
    details: XoRuntimeApplicationDetails;

    private _forceRefresh: boolean;

    @Input()
    get forceRefresh(): boolean {
        return this._forceRefresh;
    }

    set forceRefresh(value: boolean) {
        if (value) {
            this._forceRefresh = true;
        }
    }

    @Output()
    readonly validationChange = new EventEmitter<void>();

    @Output()
    readonly selectionChange = new EventEmitter<Application>();

    @Output()
    readonly selectionDetailsChange = new EventEmitter<XoRuntimeApplication>();

    requiresDataSource: XcRemoteTableDataSource;

    requiredByDataSource: XcRemoteTableDataSource;

    contentDataSource: XcRemoteTableDataSource;

    issues = new Array<XoIssue>();
    truncateIssues = true;

    constructor(
        private readonly apiService: ApiService,
        private readonly dialogService: XcDialogService,
        private readonly i18n: I18nService,
        private readonly zone: NgZone,
        private readonly settings: FactoryManagerSettingsService
    ) {
    }


    ngOnInit() {
        // create requires data source
        this.requiresDataSource = new XcRemoteTableDataSource(this.apiService, undefined, FM_RTC, ORDER_TYPES.GET_DEPENDENT_RTCS, createDependenciesTableInfoClass(false));
        this.requiresDataSource.refreshOnFilterChange = this.settings.tableRefreshOnFilterChange;
        this.requiresDataSource.output = XoDependencyArray;
        // create required-by data source
        this.requiredByDataSource = new XcRemoteTableDataSource(this.apiService, undefined, FM_RTC, ORDER_TYPES.GET_DEPENDENT_RTCS, createDependenciesTableInfoClass(false));
        this.requiredByDataSource.refreshOnFilterChange = this.settings.tableRefreshOnFilterChange;
        this.requiredByDataSource.output = XoDependencyArray;
        // create content data source
        this.contentDataSource = new XcRemoteTableDataSource(this.apiService, undefined, FM_RTC, ORDER_TYPES.GET_APPLICATION_CONTENT, createContentTableInfoClass(false));
        this.contentDataSource.refreshOnFilterChange = this.settings.tableRefreshOnFilterChange;
        this.contentDataSource.output = XoApplicationElementArray;
        // add filter for state
        this.requiresDataSource.filterEnums.set(
            XoDependency.getAccessorMap().runtimeContext.stateTemplates,
            createFilterEnumOfState(this.i18n)
        );
        // add filter for state
        this.requiredByDataSource.filterEnums.set(
            XoDependency.getAccessorMap().runtimeContext.stateTemplates,
            createFilterEnumOfState(this.i18n)
        );
        // If this component gets built but was selected before, the forceRefresh flag is set and the component will load its content immediately
        if (this.forceRefresh) {
            this.updateDataSources(this.details);
            this._forceRefresh = false;
        }
    }


    private updateDataSources(runtimeApplication: XoRuntimeApplication) {
        // update requires data source
        this.requiresDataSource.input = createDependenciesTableInput(runtimeApplication, new XoReferenceDirectionForward(), false, true);
        this.requiresDataSource.clear();
        this.requiresDataSource.refresh();
        // update required-by data source
        this.requiredByDataSource.input = createDependenciesTableInput(runtimeApplication, new XoReferenceDirectionBackwards(), false, true);
        this.requiresDataSource.clear();
        this.requiredByDataSource.refresh();
        // update content data source
        this.contentDataSource.input = XoGetApplicationContentRequest.create(runtimeApplication, false, false, false);
        this.contentDataSource.clear();
        this.contentDataSource.refresh();

        // request issues
        this.issues = [];
        this.apiService.startOrder(FM_RTC, ORDER_TYPES.GET_ISSUES, runtimeApplication, XoIssueArray, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).subscribe(result => {
            if (result.errorMessage) {
                this.dialogService.error(result.errorMessage, null, result.stackTrace.join('\r\n'));
            } else {
                this.issues = result.output[0].data as XoIssue[];
            }
        });
    }


    select(runtimeApplication: XoRuntimeApplication) {
        if (runtimeApplication) {
            this.selectionChange.emit(this.application);
            this.selectionDetailsChange.emit(runtimeApplication);
            this.updateDataSources(runtimeApplication);
            this.scrollTo();
        } else {
            this.selectionChange.emit(undefined);
            this.selectionDetailsChange.emit(undefined);
        }
    }


    scrollTo() {
        // Workaround because angular material has no observer that completes when data is loaded and the table is rendered.
        // See https://github.com/angular/components/issues/8068
        this.zone.onStable.pipe(skip(2), first(), debounceTime(100)).subscribe(() => {
            this.headerRef.nativeElement.scrollIntoView(true);
            // The parent is the scroll section. Used to get a margin of 8px at the top of the card.
            const parent = this.headerRef.nativeElement.parentElement.parentElement;
            if (parent) {
                this.headerRef.nativeElement.parentElement.parentElement.scrollTop -= 8;
            }
        });
    }


    @HostBinding('class.runtime-application')
    get hasDetails(): boolean {
        return this.application.equals(this.selection) && this.details instanceof XoRuntimeApplicationDetails;
    }


    isSelected(runtimeApplication: XoRuntimeApplication): boolean {
        return runtimeApplication.equals(this.details);
    }


    loadRuntimeApplication() {
        this.dialogService.custom(LoadRuntimeApplicationDialogComponent, {workspaceName: undefined, runtimeApplication: this.details as XoRuntimeApplication}).afterDismissResult().subscribe(
            () => {}
        );
    }


    deleteRuntimeApplication() {
        this.dialogService.custom(DeleteRuntimeApplicationDialogComponent, this.details as XoRuntimeApplication).afterDismissResult().subscribe(
            () => {
                this.validationChange.next();
                this.selection = null;
                this.application = null;
                this.details = null;
                this.select(null);
            }
        );
    }


    start() {
        this.apiService.startOrder(FM_RTC, ORDER_TYPES.START_RUNTIME_APPLICATION, this.details.proxy(), undefined, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).pipe(
            filter(result => result.errorMessage ? (this.dialogService.error(result.errorMessage, null, result.stackTrace.join('\r\n')), false) : true)
        ).subscribe(() => {
            const runtimeApplication = this.application.runtimeApplications.find(value => value.equals(this.details));
            runtimeApplication.state = XoRuntimeContextState.RUNNING;
            this.selectionDetailsChange.emit(runtimeApplication);
        });
    }


    stop() {
        this.apiService.startOrder(FM_RTC, ORDER_TYPES.STOP_RUNTIME_APPLICATION, this.details.proxy(), undefined, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).pipe(
            filter(result => result.errorMessage ? (this.dialogService.error(result.errorMessage, null, result.stackTrace.join('\r\n')), false) : true)
        ).subscribe(() => {
            const runtimeApplication = this.application.runtimeApplications.find(value => value.equals(this.details));
            runtimeApplication.state = XoRuntimeContextState.STOPPED;
            this.selectionDetailsChange.emit(runtimeApplication);
        });
    }


    startMigration() {
        this.dialogService.custom(MigrateWizardComponent, <MigrationWizardData>{
            i18n: this.i18n,
            apiService: this.apiService,
            rtc: FM_RTC,
            presetSource: this.application.runtimeApplications.find(value => value.equals(this.details))
        });
    }


    export() {
        this.dialogService.custom(ExportApplicationDialogComponent, this.application.runtimeApplications.find(value => value.equals(this.details)));
    }


    get isRunning() {
        return this.details && this.details.state === XoRuntimeContextState.RUNNING;
    }


    get isStopped() {
        return this.details && this.details.state === XoRuntimeContextState.STOPPED;
    }


    manageDependencies() {
        this.dialogService.custom(ManageDependenciesDialogComponent, this.details as XoRuntimeContext).afterDismissResult().subscribe(
            () => this.requiresDataSource.refresh()
        );
    }


    manageContent() {
        this.dialogService.custom(ManageContentDialogComponent, this.details as XoRuntimeContext).afterDismissResult().subscribe(
            () => this.contentDataSource.refresh()
        );
    }


    changeOrderEntry(orderEntry: XoOrderEntry) {
        this.apiService.startOrder(FM_RTC, ORDER_TYPES.SET_RUNTIME_APPLICATION_ORDER_ENTRY, [this.details.proxy(), orderEntry], undefined, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).pipe(
            filter(result => result.errorMessage ? (this.dialogService.error(result.errorMessage), false) : true)
        ).subscribe(() => {
            const runtimeApplication = this.application.runtimeApplications.find(value => value.equals(this.details));
            this.selectionDetailsChange.emit(runtimeApplication);
        });
    }
}

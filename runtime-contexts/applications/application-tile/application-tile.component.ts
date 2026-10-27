import { debounceTime, filter, first, skip } from 'rxjs/operators';

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
import { ChangeDetectionStrategy, Component, ElementRef, HostBinding, inject, Input, input, linkedSignal, NgZone, OnInit, output, viewChild } from '@angular/core';
import { FMAN_RTC } from '@fman/factory-manager.component';
import { ExportApplicationDialogComponent } from '@fman/runtime-contexts/dialog/export-application/export-application-dialog.component';
import { XoGetApplicationContentRequest } from '@fman/runtime-contexts/xo/xo-get-application-content-request.model';
import { ApiService, StartOrderOptionsBuilder } from '@zeta/api';
import { I18nService, XcI18nPipe, XcI18nTranslateDirective } from '@zeta/i18n';
import { XcButtonComponent, XcCheckboxComponent, XcDialogService, XcFormInputComponent, XcIconComponent, XcPanelComponent, XcRemoteTableDataSource, XcTableComponent, XcTooltipDirective, XDSIconName } from '@zeta/xc';

import { FactoryManagerSettingsService } from '../../../misc/services/factory-manager-settings.service';
import { createContentTableInfoClass } from '../../content';
import { createDependenciesTableInfoClass, createDependenciesTableInput, createFilterEnumOfState } from '../../dependencies';
import { DeleteRuntimeApplicationDialogComponent } from '../../dialog/delete-runtime-application/delete-runtime-application-dialog.component';
import { LoadRuntimeApplicationDialogComponent } from '../../dialog/load-runtime-application/load-runtime-application-dialog.component';
import { ManageContentDialogComponent } from '../../dialog/manage-content/manage-content-dialog.component';
import { ManageDependenciesDialogComponent } from '../../dialog/manage-dependencies/manage-dependencies-dialog.component';
import { MigrateWizardComponent, MigrationWizardData } from '../../dialog/migrate-wizard/migrate-wizard.component';
import { ORDER_TYPES } from '../../order-types';
import { RuntimeContextButtonComponent } from '../../shared/runtime-context-button.component';
import { XoApplicationElementArray } from '../../xo/xo-application-element.model';
import { XoDependency, XoDependencyArray } from '../../xo/xo-dependency.model';
import { XoIssue, XoIssueArray } from '../../xo/xo-issue.model';
import { XoOrderEntry } from '../../xo/xo-order-entry.model';
import { XoReferenceDirectionBackwards } from '../../xo/xo-reference-direction-backwards.model';
import { XoReferenceDirectionForward } from '../../xo/xo-reference-direction-forward.model';
import { XoRuntimeApplicationDetails } from '../../xo/xo-runtime-application-details.model';
import { XoRuntimeApplication } from '../../xo/xo-runtime-application.model';
import { XoRuntimeContextState } from '../../xo/xo-runtime-context-state.model';
import { Application } from '../application-data-source';


@Component({
    changeDetection: ChangeDetectionStrategy.Eager,
    selector: 'application-tile',
    templateUrl: './application-tile.component.html',
    styleUrls: ['./application-tile.component.scss'],
    imports: [RuntimeContextButtonComponent, XcI18nTranslateDirective, XcI18nPipe, XcButtonComponent, XcCheckboxComponent, XcFormInputComponent, XcIconComponent, XcPanelComponent, XcTableComponent, XcTooltipDirective]
})
export class ApplicationTileComponent implements OnInit {
    private readonly apiService = inject(ApiService);
    private readonly dialogService = inject(XcDialogService);
    private readonly i18n = inject(I18nService);
    private readonly zone = inject(NgZone);
    private readonly settings = inject(FactoryManagerSettingsService);

    readonly headerRef = viewChild<ElementRef>('header');

    readonly XDSIconName = XDSIconName;

    readonly applicationInput = input<Application>(undefined, { alias: 'application' });
    readonly application = linkedSignal(() => this.applicationInput());

    readonly selectionInput = input<Application>(undefined, { alias: 'selection' });
    readonly selection = linkedSignal(() => this.selectionInput());

    readonly detailsInput = input<XoRuntimeApplicationDetails>(undefined, { alias: 'details' });
    readonly details = linkedSignal(() => this.detailsInput());

    collapsedRequiredRow = false;

    // @ts-expect-error(TODO:)
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

    readonly validationChange = output<void>();

    readonly selectionChange = output<Application>();

    readonly selectionDetailsChange = output<XoRuntimeApplication>();

    // @ts-expect-error(TODO:)
    requiresDataSource: XcRemoteTableDataSource;

    // @ts-expect-error(TODO:)
    requiredByDataSource: XcRemoteTableDataSource;

    // @ts-expect-error(TODO:)
    contentDataSource: XcRemoteTableDataSource;

    issues = new Array<XoIssue>();
    truncateIssues = true;


    ngOnInit() {
        // create requires data source
        // @ts-expect-error(TODO:)
        this.requiresDataSource = new XcRemoteTableDataSource(this.apiService, undefined, FMAN_RTC, ORDER_TYPES.GET_DEPENDENT_RTCS, createDependenciesTableInfoClass(false));
        this.requiresDataSource.refreshOnFilterChange = this.settings.tableRefreshOnFilterChange;
        this.requiresDataSource.output = XoDependencyArray;
        // create required-by data source
        // @ts-expect-error(TODO:)
        this.requiredByDataSource = new XcRemoteTableDataSource(this.apiService, undefined, FMAN_RTC, ORDER_TYPES.GET_DEPENDENT_RTCS, createDependenciesTableInfoClass(false));
        this.requiredByDataSource.refreshOnFilterChange = this.settings.tableRefreshOnFilterChange;
        this.requiredByDataSource.output = XoDependencyArray;
        // create content data source
        // @ts-expect-error(TODO:)
        this.contentDataSource = new XcRemoteTableDataSource(this.apiService, undefined, FMAN_RTC, ORDER_TYPES.GET_APPLICATION_CONTENT, createContentTableInfoClass(false));
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
            // @ts-expect-error(TODO:)
            this.updateDataSources(this.details());
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
        this.contentDataSource.input = XoGetApplicationContentRequest.create(runtimeApplication, false, false, false, true);
        this.contentDataSource.clear();
        this.contentDataSource.refresh();

        // request issues
        this.issues = [];
        this.apiService.startOrder(FMAN_RTC, ORDER_TYPES.GET_ISSUES, runtimeApplication, XoIssueArray, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).subscribe(result => {
            if (result.errorMessage) {
                // @ts-expect-error(TODO:)
                this.dialogService.error(result.errorMessage, null, result.stackTrace.join('\r\n'));
            } else {
                // @ts-expect-error(TODO:)
                this.issues = result.output[0].data as XoIssue[];
            }
        });
    }


    select(runtimeApplication: XoRuntimeApplication) {
        if (runtimeApplication) {
            // @ts-expect-error(TODO:)
            this.selectionChange.emit(this.application());
            this.selectionDetailsChange.emit(runtimeApplication);
            this.updateDataSources(runtimeApplication);
            this.scrollTo();
        } else {
            // @ts-expect-error(TODO:)
            this.selectionChange.emit(undefined);
            // @ts-expect-error(TODO:)
            this.selectionDetailsChange.emit(undefined);
        }
    }


    scrollTo() {
        // Workaround because angular material has no observer that completes when data is loaded and the table is rendered.
        // See https://github.com/angular/components/issues/8068
        this.zone.onStable.pipe(skip(2), first(), debounceTime(100)).subscribe(() => {
            // @ts-expect-error(TODO:)
            this.headerRef().nativeElement.scrollIntoView(true);
            // The parent is the scroll section. Used to get a margin of 8px at the top of the card.
            // @ts-expect-error(TODO:)
            const parent = this.headerRef().nativeElement.parentElement.parentElement;
            if (parent) {
                // @ts-expect-error(TODO:)
                this.headerRef().nativeElement.parentElement.parentElement.scrollTop -= 8;
            }
        });
    }


    @HostBinding('class.runtime-application')
    get hasDetails(): boolean {
        // @ts-expect-error(TODO:)
        return this.application().equals(this.selection()) && this.details() instanceof XoRuntimeApplicationDetails;
    }


    isSelected(runtimeApplication: XoRuntimeApplication): boolean {
        // @ts-expect-error(TODO:)
        return runtimeApplication.equals(this.details());
    }


    loadRuntimeApplication() {
        // @ts-expect-error(TODO:)
        this.dialogService.custom(LoadRuntimeApplicationDialogComponent, { workspaceName: undefined, runtimeApplication: this.details() as XoRuntimeApplication }).afterDismissResult().subscribe(
            () => { }
        );
    }


    deleteRuntimeApplication() {
        // @ts-expect-error(TODO:)
        this.dialogService.custom(DeleteRuntimeApplicationDialogComponent, this.details()).afterDismissResult().subscribe(
            () => {
                this.validationChange.emit();
                // @ts-expect-error(TODO:)
                this.selection.set(null);
                // @ts-expect-error(TODO:)
                this.application.set(null);
                // @ts-expect-error(TODO:)
                this.details.set(null);
                // @ts-expect-error(TODO:)
                this.select(null);
            }
        );
    }


    start() {
        // @ts-expect-error(TODO:)
        this.apiService.startOrder(FMAN_RTC, ORDER_TYPES.START_RUNTIME_APPLICATION, this.details().proxy(), undefined, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).pipe(
            // @ts-expect-error(TODO:)
            filter(result => result.errorMessage ? (this.dialogService.error(result.errorMessage, null, result.stackTrace.join('\r\n')), false) : true)
        ).subscribe(() => {
            // @ts-expect-error(TODO:)
            const runtimeApplication = this.application().runtimeApplications.find(value => value.equals(this.details()));
            // @ts-expect-error(TODO:)
            runtimeApplication.state = XoRuntimeContextState.RUNNING;
            // @ts-expect-error(TODO:)
            this.selectionDetailsChange.emit(runtimeApplication);
        });
    }


    stop() {
        // @ts-expect-error(TODO:)
        this.apiService.startOrder(FMAN_RTC, ORDER_TYPES.STOP_RUNTIME_APPLICATION, this.details().proxy(), undefined, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).pipe(
            // @ts-expect-error(TODO:)
            filter(result => result.errorMessage ? (this.dialogService.error(result.errorMessage, null, result.stackTrace.join('\r\n')), false) : true)
        ).subscribe(() => {
            // @ts-expect-error(TODO:)
            const runtimeApplication = this.application().runtimeApplications.find(value => value.equals(this.details()));
            // @ts-expect-error(TODO:)
            runtimeApplication.state = XoRuntimeContextState.STOPPED;
            // @ts-expect-error(TODO:)
            this.selectionDetailsChange.emit(runtimeApplication);
        });
    }


    startMigration() {
        // @ts-expect-error(TODO:)
        this.dialogService.custom(MigrateWizardComponent, {
            i18n: this.i18n,
            apiService: this.apiService,
            rtc: FMAN_RTC,
            // @ts-expect-error(TODO:)
            presetSource: this.application().runtimeApplications.find(value => value.equals(this.details()))
        });
    }


    export() {
        // @ts-expect-error(TODO:)
        this.dialogService.custom(ExportApplicationDialogComponent, this.application().runtimeApplications.find(value => value.equals(this.details())));
    }


    get isRunning() {
        const details = this.details();
        return details && details.state === XoRuntimeContextState.RUNNING;
    }


    get isStopped() {
        const details = this.details();
        return details && details.state === XoRuntimeContextState.STOPPED;
    }


    manageDependencies() {
        // @ts-expect-error(TODO:)
        this.dialogService.custom(ManageDependenciesDialogComponent, this.details()).afterDismissResult().subscribe(
            () => this.requiresDataSource.refresh()
        );
    }


    manageContent() {
        // @ts-expect-error(TODO:)
        this.dialogService.custom(ManageContentDialogComponent, this.details()).afterDismissResult().subscribe(
            () => this.contentDataSource.refresh()
        );
    }


    changeOrderEntry(orderEntry: XoOrderEntry) {
        // @ts-expect-error(TODO:)
        this.apiService.startOrder(FMAN_RTC, ORDER_TYPES.SET_RUNTIME_APPLICATION_ORDER_ENTRY, [this.details().proxy(), orderEntry], undefined, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).pipe(
            filter(result => result.errorMessage ? (this.dialogService.error(result.errorMessage), false) : true)
        ).subscribe(() => {
            // @ts-expect-error(TODO:)
            const runtimeApplication = this.application().runtimeApplications.find(value => value.equals(this.details()));
            // @ts-expect-error(TODO:)
            this.selectionDetailsChange.emit(runtimeApplication);
        });
    }

    collapsedChange(collapsed: boolean) {
        this.collapsedRequiredRow = collapsed;
    }
}

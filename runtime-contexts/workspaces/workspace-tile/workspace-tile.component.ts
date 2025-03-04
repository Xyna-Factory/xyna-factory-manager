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
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, HostBinding, Input, NgZone, OnInit, Output, ViewChild } from '@angular/core';
import { ShowWorkspaceContentDialogComponent } from '@fman/runtime-contexts/dialog/show-workspace-content/show-workspace-content-dialog.component';
import { XoGetApplicationContentRequest } from '@fman/runtime-contexts/xo/xo-get-application-content-request.model';
import { XoGetWorkspaceContentRequest } from '@fman/runtime-contexts/xo/xo-get-workspace-content-request.model';

import { ApiService, RuntimeContext, StartOrderOptionsBuilder } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcDialogService, XcRemoteTableDataSource, XDSIconName } from '@zeta/xc';

import { debounceTime, filter, finalize, first, skip } from 'rxjs/operators';

import { FM_RTC } from '../../../const';
import { FactoryManagerSettingsService } from '../../../misc/services/factory-manager-settings.service';
import { createContentTableInfoClass } from '../../content';
import { createDependenciesTableInfoClass, createDependenciesTableInput, createFilterEnumOfState } from '../../dependencies';
import { ClearWorkspaceDialogComponent } from '../../dialog/clear-workspace/clear-workspace-dialog.component';
import { CreateApplicationDefinitionDialogComponent } from '../../dialog/create-application-definition/create-application-definition-dialog.component';
import { CreateRuntimeApplicationDialogComponent } from '../../dialog/create-runtime-application/create-runtime-application-dialog.component';
import { DeleteDuplicatesDialogComponent } from '../../dialog/delete-duplicates/delete-duplicates-dialog.component';
import { DeleteWorkspaceDialogComponent } from '../../dialog/delete-workspace/delete-workspace-dialog.component';
import { LoadRuntimeApplicationDialogComponent } from '../../dialog/load-runtime-application/load-runtime-application-dialog.component';
import { ManageContentDialogComponent } from '../../dialog/manage-content/manage-content-dialog.component';
import { ManageDependenciesDialogComponent } from '../../dialog/manage-dependencies/manage-dependencies-dialog.component';
import { MigrateWizardComponent, MigrationWizardData } from '../../dialog/migrate-wizard/migrate-wizard.component';
import { ORDER_TYPES } from '../../order-types';
import { XoApplicationDefinitionDetails } from '../../xo/xo-application-definition-details.model';
import { XoApplicationDefinition } from '../../xo/xo-application-definition.model';
import { XoApplicationElementArray } from '../../xo/xo-application-element.model';
import { XoDependency, XoDependencyArray } from '../../xo/xo-dependency.model';
import { XoDocumentation } from '../../xo/xo-documentation.model';
import { XoIssue, XoIssueArray } from '../../xo/xo-issue.model';
import { XoReferenceDirectionBackwards } from '../../xo/xo-reference-direction-backwards.model';
import { XoReferenceDirectionForward } from '../../xo/xo-reference-direction-forward.model';
import { XoRuntimeContext } from '../../xo/xo-runtime-context.model';
import { XoWorkspaceDetails } from '../../xo/xo-workspace-details.model';
import { XoWorkspace } from '../../xo/xo-workspace.model';


export const DUPLICATE_ELEMENT_IDENTIFIER = 'duplicate element';

@Component({
    selector: 'workspace-tile',
    templateUrl: './workspace-tile.component.html',
    styleUrls: ['./workspace-tile.component.scss'],
    standalone: false
})
export class WorkspaceTileComponent implements OnInit {
    @ViewChild('header', { static: false })
    headerRef: ElementRef;

    readonly XDSIconName = XDSIconName;

    @Input()
    workspace: XoWorkspace;

    @Input()
    selection: XoWorkspace;

    @Input()
    details: XoWorkspaceDetails | XoApplicationDefinitionDetails;

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
    readonly selectionChange = new EventEmitter<XoWorkspace>();

    @Output()
    readonly selectionDetailsChange = new EventEmitter<XoRuntimeContext>();

    requiresDataSource: XcRemoteTableDataSource;

    requiredByDataSource: XcRemoteTableDataSource;

    /*
     * This data source is shared between Workspace- and Application Definition-view
     * Different Order-Types, inputs and result types are used
     */
    contentDataSource: XcRemoteTableDataSource;

    documentationPending = false;

    issues = new Array<XoIssue>();
    hasDuplicateElements = false;
    truncateIssues = true;


    constructor(
        private readonly apiService: ApiService,
        private readonly dialogService: XcDialogService,
        private readonly i18n: I18nService,
        private readonly cdref: ChangeDetectorRef,
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
        this.contentDataSource = new XcRemoteTableDataSource(this.apiService, undefined, FM_RTC, undefined, createContentTableInfoClass(false));
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


    private updateDataSources(runtimeContext: XoRuntimeContext) {
        // update requires data source
        this.requiresDataSource.input = createDependenciesTableInput(runtimeContext, new XoReferenceDirectionForward(), false, true);
        this.requiresDataSource.clear();
        this.requiresDataSource.refresh();
        // update required-by data source
        this.requiredByDataSource.input = createDependenciesTableInput(runtimeContext, new XoReferenceDirectionBackwards(), false, true);
        this.requiresDataSource.clear();
        this.requiredByDataSource.refresh();
        // update content data source
        if (runtimeContext instanceof XoApplicationDefinition) {
            this.contentDataSource.input = XoGetApplicationContentRequest.create(runtimeContext, false, false, false);
            this.contentDataSource.orderType = ORDER_TYPES.GET_APPLICATION_CONTENT;
        } else if (runtimeContext instanceof XoWorkspace) {
            this.contentDataSource.input = XoGetWorkspaceContentRequest.create(runtimeContext, false);
            this.contentDataSource.orderType = ORDER_TYPES.GET_WORKSPACE_CONTENT;
        }
        this.contentDataSource.clear();
        this.contentDataSource.resetTableInfo();
        this.contentDataSource.refresh();
        // request issues
        this.issues = [];
        this.apiService.startOrder(FM_RTC, ORDER_TYPES.GET_ISSUES, runtimeContext, XoIssueArray, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage)
            .subscribe(result => {
                if (result.errorMessage) {
                    this.dialogService.error(result.errorMessage, null, result.stackTrace.join('\r\n'));
                } else {
                    this.issues = result.output[0].data as XoIssue[];
                    this.hasDuplicateElements = this.issues.filter(issue => issue.identifier === DUPLICATE_ELEMENT_IDENTIFIER).length > 0;
                }
            });
    }


    select(runtimeContext: XoRuntimeContext) {
        if (runtimeContext) {
            this.selectionChange.emit(this.workspace);
            this.selectionDetailsChange.emit(runtimeContext);
            this.updateDataSources(runtimeContext);
            this.scrollTo();
        } else {
            this.selectionChange.emit(undefined);
            this.selectionDetailsChange.emit(undefined);
        }
    }


    get hasDetails(): boolean {
        return this.workspace.equals(this.selection);
    }


    @HostBinding('class.workspace')
    get hasWorkspaceDetails(): boolean {
        return this.hasDetails && this.details instanceof XoWorkspaceDetails;
    }


    @HostBinding('class.application-definition')
    get hasApplicationDefinitionDetails(): boolean {
        return this.hasDetails && this.details instanceof XoApplicationDefinitionDetails;
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


    isSelected(runtimeContext: XoRuntimeContext): boolean {
        return (runtimeContext.equals(this.details) && (
            (this.hasWorkspaceDetails && runtimeContext instanceof XoWorkspace) ||
            (this.hasApplicationDefinitionDetails && runtimeContext instanceof XoApplicationDefinition)
        ));
    }


    isActive(): boolean {
        return RuntimeContext.fromWorkspace(this.workspace.name).equals(this.apiService.runtimeContext);
    }


    setAsActive() {
        this.apiService.runtimeContext = RuntimeContext.fromWorkspace(this.workspace.name);
    }


    startMigration() {
        let presetApplicationDefinition: XoApplicationDefinition;
        // find application definition
        if (this.details instanceof XoApplicationDefinitionDetails) {
            const applicationDefinition = this.workspace.applicationDefinitions.data.find(ad => ad.uniqueKey === this.details.uniqueKey);
            if (applicationDefinition) {
                presetApplicationDefinition = applicationDefinition.clone();
                presetApplicationDefinition.workspaceName = null;
            }
        }
        // open migration wizard dialog
        this.dialogService.custom(MigrateWizardComponent, <MigrationWizardData>{
            apiService: this.apiService,
            i18n: this.i18n,
            rtc: FM_RTC,
            presetSource: presetApplicationDefinition ?? this.details
        });
    }


    createApplicationDefinition() {
        this.dialogService.custom(CreateApplicationDefinitionDialogComponent, this.workspace.name).afterDismissResult().subscribe(
            () => this.validationChange.next()
        );
    }


    loadRuntimeApplication() {
        this.dialogService.custom(LoadRuntimeApplicationDialogComponent, { workspaceName: this.workspace.name, runtimeApplication: undefined }).afterDismissResult().subscribe(
            () => this.validationChange.next()
        );
    }


    clearWorkspace() {
        this.dialogService.custom(ClearWorkspaceDialogComponent, this.workspace).afterDismissResult().subscribe(
            () => this.validationChange.next()
        );
    }


    deleteWorkspace() {
        this.dialogService.custom(DeleteWorkspaceDialogComponent, this.workspace).afterDismissResult().subscribe(
            () => {
                this.validationChange.next();
                this.selection = null;
                this.workspace = null;
                this.details = null;
                this.select(null);
            }
        );
    }


    buildNewVersion() {
        this.dialogService.custom(CreateRuntimeApplicationDialogComponent, { workspaceName: this.workspace.name, applicationDefinitionName: this.details.name }).afterDismissResult().subscribe(
        );
    }


    deleteApplicationDefinition() {
        if (this.details instanceof XoApplicationDefinitionDetails) {
            const title = this.i18n.translate('fman.rtcs.workspaces.workspace-tile.delete-application-definition-title', { key: '$0', value: this.details.label });
            const message = this.i18n.translate('fman.rtcs.workspaces.workspace-tile.delete-application-definition-message');

            this.dialogService.confirm(title, message).afterDismissResult().subscribe((confirm: boolean) => {
                if (confirm) {
                    this.apiService.startOrder(FM_RTC, ORDER_TYPES.DELETE_APPLICATION_DEFINITION, this.details.proxy(), undefined, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).pipe(
                        filter(result => result.errorMessage ? (this.dialogService.error(result.errorMessage, null, result.stackTrace.join('\r\n')), false) : true)
                    ).subscribe(() => {
                        this.validationChange.next();
                        this.selection = null;
                        this.workspace = null;
                        this.details = null;
                        this.select(null);
                    });
                }
            });
        }
    }


    changeDocumentation(value: string) {
        if (this.details instanceof XoApplicationDefinitionDetails && value !== this.details.documentation) {
            const applicationDefinitionDetails = this.details;
            const documentation = new XoDocumentation();
            documentation.value = value;
            this.documentationPending = true;
            this.apiService.startOrder(FM_RTC, ORDER_TYPES.SET_APPLICATION_DEFINITION_DOCUMENTATION, [this.details.proxy(), documentation], null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).pipe(
                finalize(() => {
                    // trigger change detection even with an unchanged value to reset input field
                    const currentValue = applicationDefinitionDetails.documentation;
                    applicationDefinitionDetails.documentation = value;
                    this.cdref.detectChanges();
                    applicationDefinitionDetails.documentation = currentValue;
                    this.documentationPending = false;
                })
            ).subscribe(
                // set new value
                () => applicationDefinitionDetails.documentation = value
            );
        }
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


    showWorkspaceContent() {
        this.dialogService.custom(ShowWorkspaceContentDialogComponent, this.details as XoRuntimeContext);
    }


    deleteDuplicates() {
        this.dialogService.custom(DeleteDuplicatesDialogComponent, this.workspace).afterDismissResult().subscribe(
            () => this.validationChange.next()
        );
    }
}

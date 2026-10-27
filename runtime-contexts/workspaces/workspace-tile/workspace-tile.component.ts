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
import { debounceTime, filter, finalize, first, skip } from 'rxjs/operators';

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostBinding, inject, Input, input, linkedSignal, NgZone, OnInit, output, viewChild } from '@angular/core';
import { FMAN_RTC } from '@fman/factory-manager.component';
import { ShowWorkspaceContentDialogComponent } from '@fman/runtime-contexts/dialog/show-workspace-content/show-workspace-content-dialog.component';
import { XoGetApplicationContentRequest } from '@fman/runtime-contexts/xo/xo-get-application-content-request.model';
import { XoGetWorkspaceContentRequest } from '@fman/runtime-contexts/xo/xo-get-workspace-content-request.model';
import { ApiService, RuntimeContext, StartOrderOptionsBuilder } from '@zeta/api';
import { I18nService, XcI18nPipe, XcI18nTranslateDirective } from '@zeta/i18n';
import { XcButtonComponent, XcDialogService, XcFormInputComponent, XcFormLabelComponent, XcIconButtonComponent, XcIconComponent, XcPanelComponent, XcRemoteTableDataSource, XcTableComponent, XcTooltipDirective, XcVarDirective, XDSIconName } from '@zeta/xc';

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
import { RuntimeContextButtonComponent } from '../../shared/runtime-context-button.component';
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
    changeDetection: ChangeDetectionStrategy.Eager,
    selector: 'workspace-tile',
    templateUrl: './workspace-tile.component.html',
    styleUrls: ['./workspace-tile.component.scss'],
    imports: [RuntimeContextButtonComponent, XcI18nTranslateDirective, XcI18nPipe, XcButtonComponent, XcFormInputComponent, XcFormLabelComponent, XcIconButtonComponent, XcIconComponent, XcPanelComponent, XcTableComponent, XcTooltipDirective, XcVarDirective]
})
export class WorkspaceTileComponent implements OnInit {
    private readonly apiService = inject(ApiService);
    private readonly dialogService = inject(XcDialogService);
    private readonly i18n = inject(I18nService);
    private readonly cdref = inject(ChangeDetectorRef);
    private readonly zone = inject(NgZone);
    private readonly settings = inject(FactoryManagerSettingsService);

    readonly headerRef = viewChild<ElementRef>('header');

    readonly XDSIconName = XDSIconName;

    readonly workspaceInput = input<XoWorkspace>(undefined, { alias: 'workspace' });
    readonly workspace = linkedSignal(() => this.workspaceInput());

    readonly selectionInput = input<XoWorkspace>(undefined, { alias: 'selection' });
    readonly selection = linkedSignal(() => this.selectionInput());

    readonly detailsInput = input<XoWorkspaceDetails | XoApplicationDefinitionDetails>(undefined, { alias: 'details' });
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

    readonly selectionChange = output<XoWorkspace>();

    readonly selectionDetailsChange = output<XoRuntimeContext>();

    // @ts-expect-error(TODO:)
    requiresDataSource: XcRemoteTableDataSource;

    // @ts-expect-error(TODO:)
    requiredByDataSource: XcRemoteTableDataSource;

    /*
     * This data source is shared between Workspace- and Application Definition-view
     * Different Order-Types, inputs and result types are used
     */
    // @ts-expect-error(TODO:)
    contentDataSource: XcRemoteTableDataSource;

    documentationPending = false;

    issues = new Array<XoIssue>();
    hasDuplicateElements = false;
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
        this.contentDataSource = new XcRemoteTableDataSource(this.apiService, undefined, FMAN_RTC, undefined, createContentTableInfoClass(false));
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
            this.contentDataSource.input = XoGetApplicationContentRequest.create(runtimeContext, false, false, false, true);
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
        this.apiService.startOrder(FMAN_RTC, ORDER_TYPES.GET_ISSUES, runtimeContext, XoIssueArray, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage)
            .subscribe(result => {
                if (result.errorMessage) {
                    // @ts-expect-error(TODO:)
                    this.dialogService.error(result.errorMessage, null, result.stackTrace.join('\r\n'));
                } else {
                    // @ts-expect-error(TODO:)
                    this.issues = result.output[0].data as XoIssue[];
                    this.hasDuplicateElements = this.issues.filter(issue => issue.identifier === DUPLICATE_ELEMENT_IDENTIFIER).length > 0;
                }
            });
    }


    select(runtimeContext: XoRuntimeContext) {
        if (runtimeContext) {
            // @ts-expect-error(TODO:)
            this.selectionChange.emit(this.workspace());
            this.selectionDetailsChange.emit(runtimeContext);
            this.updateDataSources(runtimeContext);
            this.scrollTo();
        } else {
            // @ts-expect-error(TODO:)
            this.selectionChange.emit(undefined);
            // @ts-expect-error(TODO:)
            this.selectionDetailsChange.emit(undefined);
        }
    }


    get hasDetails(): boolean {
        // @ts-expect-error(TODO:)
        return this.workspace().equals(this.selection());
    }


    @HostBinding('class.workspace')
    get hasWorkspaceDetails(): boolean {
        return this.hasDetails && this.details() instanceof XoWorkspaceDetails;
    }


    @HostBinding('class.application-definition')
    get hasApplicationDefinitionDetails(): boolean {
        return this.hasDetails && this.details() instanceof XoApplicationDefinitionDetails;
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


    isSelected(runtimeContext?: XoRuntimeContext): boolean {
        const details = this.details();
        return (runtimeContext !== undefined && details !== undefined && runtimeContext.equals(details) && (
            (this.hasWorkspaceDetails && runtimeContext instanceof XoWorkspace) ||
            (this.hasApplicationDefinitionDetails && runtimeContext instanceof XoApplicationDefinition)
        ));
    }


    isActive(): boolean {
        // @ts-expect-error(TODO:)
        return RuntimeContext.fromWorkspace(this.workspace().name).equals(this.apiService.runtimeContext);
    }


    setAsActive() {
        // @ts-expect-error(TODO:)
        this.apiService.runtimeContext = RuntimeContext.fromWorkspace(this.workspace().name);
    }


    startMigration() {
        let presetApplicationDefinition: XoApplicationDefinition;
        // find application definition
        const details = this.details();
        if (details instanceof XoApplicationDefinitionDetails) {
            // @ts-expect-error(TODO:)
            const applicationDefinition = this.workspace().applicationDefinitions.data.find(ad => ad.uniqueKey === this.details().uniqueKey);
            if (applicationDefinition) {
                presetApplicationDefinition = applicationDefinition.clone();
                // @ts-expect-error(TODO:)
                presetApplicationDefinition.workspaceName = null;
            }
        }
        // open migration wizard dialog
        // @ts-expect-error(TODO:)
        this.dialogService.custom(MigrateWizardComponent, {
            apiService: this.apiService,
            i18n: this.i18n,
            rtc: FMAN_RTC,
            // @ts-expect-error(TODO:)
            presetSource: presetApplicationDefinition ?? details
        });
    }


    createApplicationDefinition() {
        // @ts-expect-error(TODO:)
        this.dialogService.custom(CreateApplicationDefinitionDialogComponent, this.workspace().name).afterDismissResult().subscribe(
            () => this.validationChange.emit()
        );
    }


    loadRuntimeApplication() {
        // @ts-expect-error(TODO:)
        this.dialogService.custom(LoadRuntimeApplicationDialogComponent, { workspaceName: this.workspace().name, runtimeApplication: undefined }).afterDismissResult().subscribe(
            () => this.validationChange.emit()
        );
    }


    clearWorkspace() {
        this.dialogService.custom(ClearWorkspaceDialogComponent, this.workspace()).afterDismissResult().subscribe(
            () => this.validationChange.emit()
        );
    }


    deleteWorkspace() {
        this.dialogService.custom(DeleteWorkspaceDialogComponent, this.workspace()).afterDismissResult().subscribe(
            () => {
                this.validationChange.emit();
                // @ts-expect-error(TODO:)
                this.selection.set(null);
                // @ts-expect-error(TODO:)
                this.workspace.set(null);
                // @ts-expect-error(TODO:)
                this.details.set(null);
                // @ts-expect-error(TODO:)
                this.select(null);
            }
        );
    }


    buildNewVersion() {
        // @ts-expect-error(TODO:)
        this.dialogService.custom(CreateRuntimeApplicationDialogComponent, { workspaceName: this.workspace().name, applicationDefinitionName: this.details().name }).afterDismissResult().subscribe(
        );
    }


    deleteApplicationDefinition() {
        const details = this.details();
        if (details instanceof XoApplicationDefinitionDetails) {
            const title = this.i18n.translateInstant('fman.rtcs.workspaces.workspace-tile.delete-application-definition-title', { key: '$0', value: details.label });
            const message = this.i18n.translateInstant('fman.rtcs.workspaces.workspace-tile.delete-application-definition-message');

            this.dialogService.confirm(title, message).afterDismissResult().subscribe((confirm: boolean) => {
                if (confirm) {
                    // @ts-expect-error(TODO:)
                    this.apiService.startOrder(FMAN_RTC, ORDER_TYPES.DELETE_APPLICATION_DEFINITION, this.details().proxy(), undefined, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).pipe(
                        // @ts-expect-error(TODO:)
                        filter(result => result.errorMessage ? (this.dialogService.error(result.errorMessage, null, result.stackTrace.join('\r\n')), false) : true)
                    ).subscribe(() => {
                        this.validationChange.emit();
                        // @ts-expect-error(TODO:)
                        this.selection.set(null);
                        // @ts-expect-error(TODO:)
                        this.workspace.set(null);
                        // @ts-expect-error(TODO:)
                        this.details.set(null);
                        // @ts-expect-error(TODO:)
                        this.select(null);
                    });
                }
            });
        }
    }


    changeDocumentation(value: string) {
        const details = this.details();
        if (details instanceof XoApplicationDefinitionDetails && value !== details.documentation) {
            const applicationDefinitionDetails = details;
            const documentation = new XoDocumentation();
            documentation.value = value;
            this.documentationPending = true;
            // @ts-expect-error(TODO:)
            this.apiService.startOrder(FMAN_RTC, ORDER_TYPES.SET_APPLICATION_DEFINITION_DOCUMENTATION, [details.proxy(), documentation], null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).pipe(
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


    showWorkspaceContent() {
        // @ts-expect-error(TODO:)
        this.dialogService.custom(ShowWorkspaceContentDialogComponent, this.details());
    }


    deleteDuplicates() {
        this.dialogService.custom(DeleteDuplicatesDialogComponent, this.workspace()).afterDismissResult().subscribe(
            () => this.validationChange.emit()
        );
    }

    collapsedChange(collapsed: boolean) {
        this.collapsedRequiredRow = collapsed;
    }
}

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

import { XoRTCMigrationResultArray } from '@fman/runtime-contexts/xo/xo-rtcmigration-result.model';
import { XoRTCName } from '@fman/runtime-contexts/xo/xo-rtcname.model';
import { XoRuntimeContextTableEntry, XoRuntimeContextTableEntryArray } from '@fman/runtime-contexts/xo/xo-runtime-context-table-entry.model';
import { ApiService, RuntimeContext, StartOrderOptionsBuilder, Xo, XoObject } from '@zeta/api';
import { Comparable } from '@zeta/base';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XcDialogComponent, XcLocalTableDataSource, XcRemoteTableDataSource, XcTableDataSource, XDSIconName, XoRemappingTableInfoClass, XoTableColumn, XoTableInfo } from '@zeta/xc';

import { filter, finalize } from 'rxjs/operators';

import { FactoryManagerSettingsService } from '../../../misc/services/factory-manager-settings.service';
import { createFilterEnumOfState } from '../../dependencies';
import { XoFactoryNode, XoFactoryNodeArray } from '../../xo/xo-factory-node.model';
import { XoMigrateRTCsRequest } from '../../xo/xo-migrate-rtcs-request.model';
import { XoRuntimeApplication } from '../../xo/xo-runtime-application.model';
import { XoRuntimeContext } from '../../xo/xo-runtime-context.model';
import { migrateWizard_translations_de_DE } from './locale/migrate-wizard-translations.de-DE';
import { migrateWizard_translations_en_US } from './locale/migrate-wizard-translations.en-US';


export interface MigrationWizardData {
    i18n: I18nService;
    apiService: ApiService;
    rtc: RuntimeContext;
    presetState?: MigrateWizardStateEnum;
    presetSource?: XoRuntimeContext;
}

export enum MigrateWizardStateEnum {
    CHOOSENODE = 'chooseNode',
    CHOOSESOURCE = 'chooseSource',
    CHOOSTARGET = 'chooseTarget',
    SUMMARY = 'summary',
    RESULT = 'result'
}

export const MigrateWizardStateArray = [
    MigrateWizardStateEnum.CHOOSENODE,
    MigrateWizardStateEnum.CHOOSESOURCE,
    MigrateWizardStateEnum.CHOOSTARGET,
    MigrateWizardStateEnum.SUMMARY,
    MigrateWizardStateEnum.RESULT
];

export class MigrationObject implements Comparable {
    nodeLabel;
    sourceLabel;
    targetLabel;

    constructor(public node: XoFactoryNode, public source: XoRuntimeContext, public target: XoRuntimeContext) {
        this.nodeLabel = node.name;

        switch (source.constructor) {
            case XoRuntimeApplication:
                this.sourceLabel = (source.data as any).name + ' ' + (source.data as any).version;
                break;
            default:
                this.sourceLabel = source.name;
                break;
        }

        switch (target.constructor) {
            case XoRuntimeApplication:
                this.targetLabel = (target.data as any).name + ' ' + (target.data as any).version;
                break;
            default:
                this.targetLabel = target.name;
                break;
        }
    }

    get uniqueKey(): string {
        return this.node.name + this.source.uniqueKey + this.target.uniqueKey;
    }

    equals(that: this): boolean {
        return that.uniqueKey === this.uniqueKey;
    }
}

export class RuntimeContextTableInfo extends XoTableInfo {
    protected afterDecode() {
        /** Add version column to table */
        if (!this.columns.data.some(i => i.path === XoRuntimeContextTableEntry.getAccessorMap().version)) {
            const versionColumn = new XoTableColumn('');
            versionColumn.name = 'Version';
            versionColumn.path = XoRuntimeContextTableEntry.getAccessorMap().version;
            versionColumn.shrink = true;
            this.columns.append(versionColumn);
        }

        /** Shrink state column */
        this.columns.data.forEach(column => {
            if (column.path === XoRuntimeContextTableEntry.getAccessorMap().runtimeContext.state) {
                column.shrink = true;
            }
        });
    }
}

@Component({
    selector: 'migrate-wizard',
    templateUrl: './migrate-wizard.component.html',
    styleUrls: ['./migrate-wizard.component.scss'],
    standalone: false
})
export class MigrateWizardComponent extends XcDialogComponent<boolean, MigrationWizardData> {
    /** Current state of wizard (can be set via injected data to skip a step) */
    private migrateWizardState: MigrateWizardStateEnum = this.injectedData.presetState || MigrateWizardStateEnum.CHOOSENODE;

    private readonly tableNodesSource: XcLocalTableDataSource<XoFactoryNode>;
    private readonly tableSourcesSource: XcRemoteTableDataSource;
    private readonly tableMigrationSource: XcLocalTableDataSource;
    private tableTargetsSource: XcRemoteTableDataSource;

    private activeSelectedNode: XoFactoryNode;
    private activeSelectedSource: XoRuntimeContext;
    private activeSelectedTarget: XoRuntimeContext;

    private currentWizardSelectedNode: XoFactoryNode;
    private currentWizardSelectedSource: XoRuntimeContext;
    private currentWizardSelectedTarget: XoRuntimeContext;

    private readonly migrationData: MigrationObject[] = [];

    private readonly getRtcOrder = 'xmcp.factorymanager.rtcmanager.GetRTCs';
    private readonly nodeSourceOrder = 'xmcp.factorymanager.rtcmanager.GetFactoryNodes';
    private readonly migrationOrder = 'xmcp.factorymanager.rtcmanager.MigrateRTCs';

    abortProbelamticOrders: boolean;
    onlyOneFactoryNode: boolean;
    XDSIconName = XDSIconName;
    loading: boolean;
    result: XoRTCMigrationResultArray;
    resultError: string;

    /** Return translated name of current step */
    get stepName(): string {
        return this.injectedData.i18n.translate(`xfm.fman.rtcs.migrate-wizard.step.${this.migrateWizardState}`);
    }

    /** Return number of the step (0-3) */
    get stepNumber(): number {
        return MigrateWizardStateArray.indexOf(this.migrateWizardState);
    }

    /** Return true if the current step is the last step */
    get lastStep(): boolean {
        return this.stepNumber === MigrateWizardStateArray.length - 1;
    }

    /** Label for the back button */
    get stepBackButtonName(): string {
        if (this.migrateWizardState === MigrateWizardStateEnum.SUMMARY || this.migrateWizardState === MigrateWizardStateEnum.RESULT) {
            return null;
        }
        return this.getStepByOffset(-1) ? this.injectedData.i18n.translate(`xfm.fman.rtcs.migrate-wizard.step.${this.getStepByOffset(-1)}`) : null;
    }

    /** Label for the next button */
    get stepNextButtonName(): string {
        if (this.migrateWizardState === MigrateWizardStateEnum.CHOOSENODE && this.injectedData.presetSource) {
            return this.injectedData.i18n.translate('xfm.fman.rtcs.migrate-wizard.step.chooseTarget');
        }
        if (this.migrateWizardState === MigrateWizardStateEnum.CHOOSTARGET) {
            return this.injectedData.i18n.translate('xfm.fman.rtcs.migrate-wizard.step.summaryButton');
        }
        if (this.migrateWizardState === MigrateWizardStateEnum.SUMMARY) {
            return this.injectedData.i18n.translate('xfm.fman.rtcs.migrate-wizard.step.migrate');
        }
        return this.getStepByOffset(+1) ? this.injectedData.i18n.translate(`xfm.fman.rtcs.migrate-wizard.step.${this.getStepByOffset(+1)}`) : null;
    }

    get closeButtonName(): string {
        return this.injectedData.i18n.translate(
            this.migrateWizardState === MigrateWizardStateEnum.RESULT ? 'xfm.fman.rtcs.migrate-wizard.close' : 'xfm.fman.rtcs.migrate-wizard.cancel'
        );
    }

    /** Returns the table source for the current step */
    get tableSource(): XcTableDataSource {
        switch (this.stepNumber) {
            case 0:
                if (!this.activeSelectedNode && this.currentWizardSelectedNode) {
                    // If something was selected previously, this will restore the selection
                    setTimeout(() => {
                        this.tableNodesSource.selectionModel.select(this.currentWizardSelectedNode);
                    }, 0);
                }
                return this.tableNodesSource;
            case 1:
                return this.tableSourcesSource;
            case 2:
                return this.tableTargetsSource;
            case 3:
                this.tableMigrationSource.localTableData.rows = this.migrationData;
                return this.tableMigrationSource;
        }
        return null;
    }

    constructor(injector: Injector, private readonly settings: FactoryManagerSettingsService) {
        super(injector);

        this.injectedData.i18n.setTranslations(LocaleService.DE_DE, migrateWizard_translations_de_DE);
        this.injectedData.i18n.setTranslations(LocaleService.EN_US, migrateWizard_translations_en_US);

        // If a source is provided
        if (this.injectedData.presetSource) {
            // this.activeSelectedSource = this.injectedData.presetSource;
            this.currentWizardSelectedSource = this.injectedData.presetSource;
        }

        // Build node table
        this.tableNodesSource = new XcLocalTableDataSource(this.injectedData.i18n);
        this.tableNodesSource.localTableData = {
            rows: [],
            columns: [
                { path: 'name', name: this.injectedData.i18n.translate('xfm.fman.rtcs.migrate-wizard.table.name') },
                { path: 'isLocal', name: this.injectedData.i18n.translate('xfm.fman.rtcs.migrate-wizard.table.isLocal') }
            ]
        };
        this.tableNodesSource.refreshOnFilterChange = this.settings.tableRefreshOnFilterChange;

        // Build migration summary table
        this.tableMigrationSource = new XcLocalTableDataSource(this.injectedData.i18n);
        this.tableMigrationSource.localTableData = {
            rows: [],
            columns: [
                { path: 'nodeLabel', name: this.injectedData.i18n.translate('xfm.fman.rtcs.migrate-wizard.table.node') },
                { path: 'sourceLabel', name: this.injectedData.i18n.translate('xfm.fman.rtcs.migrate-wizard.table.source') },
                { path: 'targetLabel', name: this.injectedData.i18n.translate('xfm.fman.rtcs.migrate-wizard.table.target') }
            ]
        };

        // Action element to delete a migration object
        this.tableMigrationSource.actionElements = [
            {
                class: 'delete-action-element',
                iconName: 'delete',
                tooltip: this.injectedData.i18n.translate('xfm.fman.rtcs.migrate-wizard.delete'),
                onAction: this.removeMigrationObject.bind(this)
            }
        ];
        this.tableMigrationSource.refreshOnFilterChange = this.settings.tableRefreshOnFilterChange;

        // Get factory nodes
        this.injectedData.apiService
            .startOrder(this.injectedData.rtc, this.nodeSourceOrder, [], XoFactoryNodeArray, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage)
            .subscribe(result => {
                // Fill rows
                this.tableNodesSource.localTableData.rows = result.output[0].data;

                // Select the node if only one exists and go to the next wizard step
                if (result.output[0].data.length === 1) {
                    this.onlyOneFactoryNode = true;
                    this.tableNodesSource.selectionModel.select(result.output[0].data[0]);
                    this.step(1);
                }

                this.tableNodesSource.refresh();
            });

        // Listen for selection changes
        this.tableNodesSource.selectionModel.selectionChange.subscribe(selectionModel => {
            this.activeSelectedNode = selectionModel.selection ? selectionModel.selection[0] : null;
            if (this.activeSelectedNode) {
                this.currentWizardSelectedNode = this.activeSelectedNode;
                if (this.tableSourcesSource && this.tableTargetsSource) {
                    [this.tableSourcesSource, this.tableTargetsSource].forEach(source => {
                        source.input[1] = this.currentWizardSelectedNode;
                        source.resetTableInfo();
                    });
                }
            }
        });

        // Build sources table
        this.tableSourcesSource = this.buildRTCTable([new XoRTCName(undefined, ''), new XoFactoryNode(undefined, '')]);

        // Listen for selection change events
        this.tableSourcesSource.selectionModel.selectionChange.subscribe(selectionModel => {
            this.activeSelectedSource =
                selectionModel.selection && selectionModel.selection[0] ? (selectionModel.selection[0] as XoRuntimeContextTableEntry).runtimeContext : null;
            if (this.activeSelectedSource) {
                this.currentWizardSelectedSource = this.activeSelectedSource.clone();
                this.tableTargetsSource.input = [new XoRTCName(undefined, this.currentWizardSelectedSource.name), this.currentWizardSelectedNode];
            }
        });

        // Restore selection
        this.tableSourcesSource.dataChange.subscribe(values => {
            if (!this.activeSelectedSource && this.currentWizardSelectedSource && values.length !== 0) {
                // If something was selected previously, this will restore the selection
                this.restoreEntry(values, this.currentWizardSelectedSource, this.tableSourcesSource);
            }
        });

        // Build target table
        this.tableTargetsSource = this.buildRTCTable([new XoRTCName(undefined, ''), new XoFactoryNode(undefined, '')]);

        // Listen for selection change events
        this.tableTargetsSource.selectionModel.selectionChange.subscribe(selectionModel => {
            this.activeSelectedTarget =
                selectionModel.selection && selectionModel.selection[0] ? (selectionModel.selection[0] as XoRuntimeContextTableEntry).runtimeContext : null;
            if (this.activeSelectedTarget) {
                this.currentWizardSelectedTarget = this.activeSelectedTarget.clone();
            }
        });

        // Restore selection
        this.tableTargetsSource.dataChange.subscribe(values => {
            if (!this.activeSelectedTarget && this.currentWizardSelectedTarget) {
                // If something was selected previously, this will restore the selection
                this.restoreEntry(values, this.currentWizardSelectedTarget, this.tableTargetsSource);
            }
        });

        // Active listeners so the user can dblclick on a row to continue
        this.tableNodesSource.selectionModel.activatedChange.pipe(filter(target => !!target.activated)).subscribe(this.stepForwardIfAllowed.bind(this));
        this.tableSourcesSource.selectionModel.activatedChange.pipe(filter(target => !!target.activated)).subscribe(this.stepForwardIfAllowed.bind(this));
        this.tableTargetsSource.selectionModel.activatedChange.pipe(filter(target => !!target.activated)).subscribe(this.stepForwardIfAllowed.bind(this));
    }

    private restoreEntry(entrys: XoObject[], target: XoRuntimeContext, dataSource: XcRemoteTableDataSource) {
        if (entrys.find(this.restore(target))) {
            dataSource.selectionModel.select(
                entrys.find(this.restore(target))
            );
        }
    }

    private readonly restore = (target: XoRuntimeContext) => (entry: XoRuntimeContextTableEntry) => (target ? target.uniqueKey : '') === (entry ? entry.runtimeContext.uniqueKey : '');

    private buildRTCTable(workflowInput?: Xo | Xo[]): XcRemoteTableDataSource {
        // Template for state
        const remappingTableInfoClass = XoRemappingTableInfoClass(RuntimeContextTableInfo, XoRuntimeContextTableEntry, {
            src: t => t.runtimeContext.state,
            dst: t => t.runtimeContext.stateTemplates
        });

        // Build new table
        const table = new XcRemoteTableDataSource<XoRuntimeContextTableEntry>(
            this.injectedData.apiService,
            this.injectedData.i18n,
            this.injectedData.rtc,
            this.getRtcOrder,
            remappingTableInfoClass
        );

        // Set Input/Output
        table.output = XoRuntimeContextTableEntryArray;
        table.refreshOnFilterChange = this.settings.tableRefreshOnFilterChange;
        if (workflowInput) {
            table.input = workflowInput;
        }

        table.filterEnums.set(XoRuntimeContextTableEntry.getAccessorMap().runtimeContext.stateTemplates, createFilterEnumOfState(this.injectedData.i18n));
        return table;
    }

    /** Removes an object from the migration list */
    private removeMigrationObject(object: MigrationObject) {
        this.migrationData.splice(this.migrationData.indexOf(object), 1);
        this.tableMigrationSource.localTableData.rows = this.migrationData;
        this.tableMigrationSource.refresh();
    }

    /** Steps one step foreward if allowed */
    private stepForwardIfAllowed() {
        if (this.canStepToOffset(1)) {
            this.step(1);
        }
    }

    /** Migrate */
    private migrate() {
        const payload = new XoMigrateRTCsRequest('', this.migrationData, this.abortProbelamticOrders);
        this.loading = true;
        this.injectedData.apiService
            .startOrder(this.injectedData.rtc, this.migrationOrder, payload, XoRTCMigrationResultArray, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage)
            .pipe(
                finalize(() => {
                    this.loading = false;
                })
            )
            .subscribe(result => {
                if (!result.errorMessage) {
                    this.result = result.output[0] as XoRTCMigrationResultArray;
                } else {
                    this.resultError = result.errorMessage;
                }
            });
    }

    /** Return true if the user is allowed to move to the current step + offset */
    canStepToOffset(offset: number): boolean {
        // If there is a next / previous step
        const inRange = this.stepNumber + offset >= 0 && this.stepNumber + offset < MigrateWizardStateArray.length;

        // If in step 0,1 or 2 there needs to be a selection
        switch (offset > 0 ? this.stepNumber : undefined) {
            case 0:
                return inRange && !!this.activeSelectedNode;
            case 1:
                return inRange && !!this.activeSelectedSource;
            case 2:
                return inRange && !!this.activeSelectedTarget;
            case 3:
                return !!this.migrationData.length;
        }

        return inRange;
    }

    /** Return a translated message if the button is disabled */
    disabledTooltipForOffset(offset: number): string {
        // Currently only a missing selection can prevent the user from going a step forth
        return this.canStepToOffset(offset) ? null : this.injectedData.i18n.translate('xfm.fman.rtcs.migrate-wizard.needSelecion');
    }

    /** Return the step name +/- a offset */
    getStepByOffset(offset: number): MigrateWizardStateEnum {
        return this.stepNumber + offset >= 0 && this.stepNumber + offset < MigrateWizardStateArray.length
            ? MigrateWizardStateArray[this.stepNumber + offset]
            : null;
    }

    /** Step forward or backward based on the step count */
    step(stepCount: number) {
        if (this.identifyStep(this.stepNumber + stepCount) === MigrateWizardStateEnum.RESULT) {
            /** Last step (migration) */
            this.migrate();
            this.migrateWizardState =
                MigrateWizardStateArray[
                    this.stepNumber + stepCount >= 0 && this.stepNumber + stepCount < MigrateWizardStateArray.length ? this.stepNumber + stepCount : 0
                ];
        } else if (this.stepNumber + stepCount === MigrateWizardStateArray.length - 1) {
            /** Second laste step (overview) */
            this.migrationData.push(new MigrationObject(this.currentWizardSelectedNode, this.currentWizardSelectedSource, this.currentWizardSelectedTarget));
            this.migrateWizardState =
                MigrateWizardStateArray[
                    this.stepNumber + stepCount >= 0 && this.stepNumber + stepCount < MigrateWizardStateArray.length ? this.stepNumber + stepCount : 0
                ];
        } else if (this.migrateWizardState === MigrateWizardStateEnum.CHOOSENODE && this.injectedData.presetSource) {
            /** Skip source selection if preset */
            this.migrateWizardState =
                MigrateWizardStateArray[
                    this.stepNumber + stepCount + 1 >= 0 && this.stepNumber + stepCount + 1 < MigrateWizardStateArray.length
                        ? this.stepNumber + stepCount + 1
                        : 0
                ];
        } else {
            this.migrateWizardState =
                MigrateWizardStateArray[
                    this.stepNumber + stepCount >= 0 && this.stepNumber + stepCount < MigrateWizardStateArray.length ? this.stepNumber + stepCount : 0
                ];
        }
        this.afterStep();
    }

    /** Executed after step*/
    afterStep() {
        if (this.migrateWizardState === MigrateWizardStateEnum.CHOOSTARGET && !this.currentWizardSelectedTarget) {
            /** Build new table so it gets bootstrapped with an initial filter */
            this.tableTargetsSource = this.buildRTCTable([new XoRTCName(undefined, this.currentWizardSelectedSource.name), this.currentWizardSelectedNode]);

            // Listen for selection change events
            this.tableTargetsSource.selectionModel.selectionChange.subscribe(selectionModel => {
                this.activeSelectedTarget =
                    selectionModel.selection && selectionModel.selection[0] ? (selectionModel.selection[0] as XoRuntimeContextTableEntry).runtimeContext : null;
                if (this.activeSelectedTarget) {
                    this.currentWizardSelectedTarget = this.activeSelectedTarget.clone();
                }
            });

            // Restore selection
            this.tableTargetsSource.dataChange.subscribe(values => {
                if (!this.activeSelectedTarget && this.currentWizardSelectedTarget) {
                    // If something was selected previously, this will restore the selection
                    this.restoreEntry(values, this.currentWizardSelectedTarget, this.tableTargetsSource);
                }
            });

            this.tableTargetsSource.selectionModel.activatedChange.pipe(filter(target => !!target.activated)).subscribe(this.stepForwardIfAllowed.bind(this));
        }

        if (this.tableSource) {
            this.tableSource.refresh();
        }

        if (this.migrateWizardState === MigrateWizardStateEnum.SUMMARY) {
            this.migrationData.push(new MigrationObject(this.currentWizardSelectedNode, this.currentWizardSelectedSource, this.currentWizardSelectedTarget));
        }
    }

    /** Restarts the wizard */
    addAnother() {
        this.injectedData.presetSource = null;
        this.injectedData.presetState = null;

        this.currentWizardSelectedSource = null;
        this.activeSelectedSource = null;
        this.tableSourcesSource.selectionModel.activate(null);
        this.tableSourcesSource.selectionModel.clear();

        this.currentWizardSelectedTarget = null;
        this.activeSelectedTarget = null;
        this.tableTargetsSource.selectionModel.activate(null);
        this.tableTargetsSource.selectionModel.clear();

        // Skip node selection
        if (!this.onlyOneFactoryNode) {
            this.currentWizardSelectedNode = null;
            this.activeSelectedNode = null;
            this.tableNodesSource.selectionModel.activate(null);
            this.tableNodesSource.selectionModel.clear();
            this.migrateWizardState = MigrateWizardStateEnum.CHOOSENODE;
        } else {
            this.migrateWizardState = MigrateWizardStateEnum.CHOOSESOURCE;
        }
    }

    identifyStep(number: number): MigrateWizardStateEnum {
        return MigrateWizardStateArray[number];
    }

    closeDialog() {
        this.dismiss();
    }
}

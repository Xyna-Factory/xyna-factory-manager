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
import { Component, OnInit } from '@angular/core';

import { ApiService, FullQualifiedName, RuntimeContext, RuntimeContextType, StartOrderResult, XoDescriber, XoObject, XoRuntimeContext, Xo, XoStructureMethod, XoWorkspace, StartOrderOptionsBuilder, XoStorable } from '@zeta/api';
import { XoXynaProperty, XoXynaPropertyKey } from '@zeta/auth/xo/xyna-property.model';
import { Comparable, isObject } from '@zeta/base';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XcAutocompleteDataWrapper, XcDialogService, XcLocalTableDataSource, XcOptionItem, XcSelectionModel, XcSortDirection, XcStructureTreeDataSource, XcTableColumn, XoTableColumn, XoTableColumnArray, XoTableInfo } from '@zeta/xc';

import { Observable, of, Subject } from 'rxjs';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';

import { FM_RTC } from '../const';
import { FactoryManagerSettingsService } from '../misc/services/factory-manager-settings.service';
import { XYNA_PROPERTY_ISWP } from '../xyna-properties/restorable-xyna-properties.component';
import { storable_instances_translations_de_DE } from './locale/storable-instances-translations.de-DE';
import { storable_instances_translations_en_US } from './locale/storable-instances-translations.en-US';
import { StorableInstanceCreationComponent } from './modal/storable-instance-creation/storable-instance-creation.component';
import { XoComplexStorable } from './xo/xo-complex-storable.model';
import { XoDeleteParameter } from './xo/xo-deleteparameter.model';
import { XoFilterCondition } from './xo/xo-filtercondition.model';
import { XoQueryParameter } from './xo/xo-queryparamterer.model';
import { XoSelectionMask } from './xo/xo-selectionmask.model';
import { XoStoreParameter } from './xo/xo-storeparameter.model';



interface QueryInput {
    selectionMask: XoSelectionMask;
    filterCondition: XoFilterCondition;
    parameters: XoQueryParameter;
}


interface StorableTableColumn extends XcTableColumn {
    complex: boolean;
}


class StorableTableDataSource extends XcLocalTableDataSource<XoObject> {

    apiService: ApiService;
    dialogs: XcDialogService;
    private tableInfo: XoTableInfo;
    private storableType: XoDescriber;

    private _loadedStorables: XoObject[] = [];


    /**
     * Overridden request functionality
     *
     * ATTENTION:
     * Do not use default request-behavior of local table data source (local filtering and sorting) by intention
     * (i. e. no super call)
     */
    request() {
    }

    /**
     * Builds table columns from the current rtc and fqn via the getStructure() function on the apiService
     * and returns an observable of the table columns
     */
    private queryStorableColumns(describer: XoDescriber): Observable<StorableTableColumn[]> {
        return this.apiService
            .getStructure(describer.rtc, [describer]).get(describer)
            .pipe(
                map(structure =>
                    structure.children
                        // eliminate methods
                        .filter(child => !(child instanceof XoStructureMethod))
                        // check, if the child has a complex type or a list of primitives
                        .map(c => ({
                            ...c,
                            complex: !!c.typeFqn.path || !!(c as any)._children
                        }))
                ),
                map(children =>
                    children.map(child => (<StorableTableColumn>{
                        name: child.label,
                        complex: child.complex,
                        path: child.name
                    }))
                )
            );
    }

    /**
     * Builds tableInfo-xo based on a describer
     */
    private buildTableInfo(describer: XoDescriber): Observable<XoTableInfo> {
        return this.queryStorableColumns(describer).pipe(
            tap(columns => {
                this.localTableData.columns = columns.map(column => ({
                    name: column.name,
                    path: column.complex ? `complexTemplate_${column.path}` : column.path
                }));
            }),
            map(columns => {
                const xoColumns = columns.map(child => {
                    const column = new XoTableColumn();
                    column.name = child.name;
                    column.path = child.path;
                    return column;
                });
                const tableInfo = new XoTableInfo();
                tableInfo.columns = new XoTableColumnArray();
                tableInfo.columns.append(...xoColumns);
                tableInfo.rootType = `${describer.fqn.path}.${describer.fqn.name}`;
                tableInfo.bootstrap = false;
                return tableInfo;
            })
        );
    }

    /**
     * Querys input for Query-service based on the tableInfo-xo
     */
    private queryQueryInput(tableInfo: XoTableInfo): Observable<QueryInput> {
        return this.apiService.startOrder(RuntimeContext.guiHttpApplication, 'xmcp.tables.BuildQueryInput', tableInfo).pipe(
            map(response => (<QueryInput>{
                selectionMask: response.output[0],
                filterCondition: response.output[1],
                parameters: response.output[2]
            })),
            tap(queryInput => {
                // FIXME: Don't restrict columns because for a flat list (e. g. "members"), selected column must be "%0%.members.*"
                // instead of only "%0%.members" to get all data
                queryInput.selectionMask.columns = [];
            })
        );
    }


    refresh() {
        // must have a tableInfo object
        if (!this.tableInfo) {
            console.warn('Trying to refresh Storable Instances without setting a Storable descriptor!');
            return;
        }

        // transfer filters and sortings from table into tableInfo
        this.tableInfo.columns.data.forEach(column => {
            column.filter = this.getFilter(column.path);
            column.sort = column.path === this.getSortPath()
                ? XcSortDirection[this.getSortDirection()]
                : undefined;
        });

        let tableLimit: number;
        this.apiService.startOrder(
            FM_RTC,
            XYNA_PROPERTY_ISWP.Details,
            XoXynaPropertyKey.withKey('zeta.table.limit')
        ).pipe(
            map(result => result.output[0] as XoXynaProperty),
            filter(xynaProperty =>
                !!xynaProperty
            ),
            // request query input
            switchMap(xynaProperty => {
                tableLimit = +(xynaProperty.value || xynaProperty.defaultValue);
                this.tableInfo.limit = tableLimit;
                return this.queryQueryInput(this.tableInfo);
            }),
            // perform query
            switchMap(queryInput =>
                this.apiService.startOrder(
                    this.storableType.rtc,
                    'xnwh.persistence.Query',
                    [
                        queryInput.selectionMask,
                        queryInput.filterCondition,
                        queryInput.parameters
                    ],
                    undefined,
                    StartOrderOptionsBuilder.defaultOptionsWithErrorMessage
                ).pipe(catchError(() =>
                    of(<StartOrderResult<Xo>>{orderId: 'error'})
                ))
            ),
            // fill rows
            tap(result => {
                if (result.errorMessage) {
                    this.dialogs.error(this.i18n.translate('fman.storable-instances.query-storable-error', { key: '$0', value: result.errorMessage }));
                }

                this._loadedStorables = result.output?.[0]?.data ?? [];

                // build rows from loaded Storables: Map complex type columns to an XoComplexStorableTemplate
                const tableRows: any = [];
                this.loadedStorables.forEach((obj: XoObject) => {
                    // Looks for complex types and maps its path to a template path (path => `complexTemplate_${path}`)
                    for (const key of Object.keys(obj.data)) {
                        if (isObject(obj.data[key]) || Array.isArray(obj.data[key])) {
                            (obj.data as XoComplexStorable)[`complexTemplate_${key}`] = XoComplexStorable.setTemplateData(obj.data[key]);
                        }
                    }
                    tableRows.push(obj.data);
                });
                this.localTableData.rows = tableRows;

                // then refresh table data structure
                super.refresh();
                this.tableData = {
                    rows: this.localTableData.rows,
                    columns: this.localTableData.columns
                };

                this.tableCounts.displayedCount = this.tableData.rows.length;
                this.countSubject.next(this.tableCounts);
                this.data = this.loadedStorables;
            })
        ).subscribe();
    }

    /**
     * Fills table with instances of passed Storable type
     */
    setStorableType(storableType: XoDescriber) {
        this.storableType = storableType;
        this.buildTableInfo(storableType).subscribe(tableInfo => {
            this.tableInfo = tableInfo;
            this.refresh();
        });
    }

    get loadedStorables(): XoObject[] {
        return this._loadedStorables;
    }
}


@Component({
    selector: 'storable-instances',
    templateUrl: './storable-instances.component.html',
    styleUrls: ['./storable-instances.component.scss'],
    standalone: false
})
export class StorableInstancesComponent implements OnInit {
    rtcDataWrapper: XcAutocompleteDataWrapper<XoRuntimeContext>;
    fqnDataWrapper: XcAutocompleteDataWrapper<FullQualifiedName>;

    selectedRTC: XoRuntimeContext;
    selectedFQN: FullQualifiedName;
    selectedRow: XoObject;
    selectedStorable: XoObject;

    storableTableSource: StorableTableDataSource;
    tableInfo: XoTableInfo;
    structureTreeDataSource: XcStructureTreeDataSource;
    editSubject: Subject<void> = new Subject<void>();

    detailOpen = false;
    isLoadingFQNs = false;

    readonly NO_STORABLES_FOUND = 'fman.storable-instances.no-storables-found-message';
    readonly SELECT_STORABLE_PLACEHOLDER = 'fman.storable-instances.storable-selection-placeholder';


    constructor(
        private readonly apiService: ApiService,
        private readonly i18nService: I18nService,
        private readonly dialogService: XcDialogService,
        private readonly settings: FactoryManagerSettingsService
    ) {
        // prevent XoSelectionMask from being pruned
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const mask = new XoSelectionMask();

        this.i18nService.setTranslations(LocaleService.DE_DE, storable_instances_translations_de_DE);
        this.i18nService.setTranslations(LocaleService.EN_US, storable_instances_translations_en_US);

        this.storableTableSource = new StorableTableDataSource(i18nService);
        this.storableTableSource.apiService = apiService;
        this.storableTableSource.dialogs = dialogService;
        this.storableTableSource.selectionModel.selectionChange.subscribe((model: XcSelectionModel<Comparable>) => {
            this.selectedRow = this.canEditTable() ? (model.selection[0] as XoObject) : null;
            this.selectedStorable = this.selectedRow;
            if (this.selectedRow) {
                this.detailOpen = true;
            }
        });

        this.rtcDataWrapper = new XcAutocompleteDataWrapper(
            () => this.selectedRTC,
            (value: XoRuntimeContext) => {
                this.selectedRTC = value;
                this.rtcDataWrapper.update();
                this.fqnDataWrapper.values = [];
                this.fqnDataWrapper.update();
                if (value) {
                    this.updateFQNDataWrapper();
                }
            },
            []
        );

        this.fqnDataWrapper = new XcAutocompleteDataWrapper(
            () => this.selectedFQN,
            (value: FullQualifiedName) => {
                this.selectedFQN = value;
                this.fqnDataWrapper.update();
                if (value) {
                    // set new Storable type which causes a rebuild and refill of the table
                    this.storableTableSource.setStorableType({ rtc: this.selectedRTC.toRuntimeContext(), fqn: this.selectedFQN });
                }
            },
            []
        );

        this.storableTableSource.actionElements = [
            {
                class: 'delete-action-element',
                iconName: 'delete',
                tooltip: this.i18nService.translate('fman.storable-instances.delete'),
                onAction: this.deleteStorable.bind(this)
            }
        ];

        this.storableTableSource.refreshOnFilterChange = this.settings.tableRefreshOnFilterChange;
        this.storableTableSource.localTableData = {rows: [], columns: []};
    }

    ngOnInit() {
        this.apiService.getRuntimeContexts().subscribe(contexts => {
            this.rtcDataWrapper.values = [
                { name: '', value: null },
                ...contexts.map(context =>
                    (<XcOptionItem>{
                        name: context.toString(),
                        value: context
                    })
                )
            ];
            this.setDefaultRTC();
        });
    }

    /**
     * @description Sets the selected modeller rtc as rtc, fallback is the default rtc
     */
    private setDefaultRTC() {
        // Because you can only choose workspaces this can be used to find the XoRuntimeContext in the datawrapper
        const uniqueKey = `${RuntimeContextType.Workspace},${
            this.apiService.runtimeContext && this.apiService.runtimeContext.ws && this.apiService.runtimeContext.ws.workspace
                ? this.apiService.runtimeContext.ws.workspace
                : XoRuntimeContext.fromType('Workspace', RuntimeContext.defaultWorkspace.ws.workspace, -1).uniqueKey
        }`;
        this.selectedRTC = this.rtcDataWrapper.values.filter(r => !!r?.value).find(rtc => rtc?.value.uniqueKey === uniqueKey)?.value ?? XoWorkspace.fromName(RuntimeContext.defaultWorkspace.ws.workspace);
        this.rtcDataWrapper.update();
        this.fqnDataWrapper.values = [];
        this.fqnDataWrapper.update();
        this.updateFQNDataWrapper();
    }

    /**
     * @description Finds all storables and stores them in the fqnDataWrapper
     */
    private updateFQNDataWrapper() {
        this.isLoadingFQNs = true;
        this.apiService.getSubtypes(this.selectedRTC.toRuntimeContext(), [XoStorable]).get(XoStorable)
            .subscribe(structures => {
                this.fqnDataWrapper.values = structures
                    .filter(structure => !structure.typeAbstract)
                    .map(structure => <XcOptionItem<FullQualifiedName>>{
                        name: `${structure.typeFqn.path}.${structure.typeFqn.name}`,
                        value: structure.typeFqn
                    });
                this.isLoadingFQNs = false;
                this.fqnDataWrapper.update();
            });
    }

    /**
     * @description Deletes a storable and decycles its children if it contains some complex types
     */
    private deleteStorable(storableRow: any): void {
        this.dialogService
            .confirm(this.i18nService.translate('fman.storable-instances.delete'), this.i18nService.translate('fman.storable-instances.delete-confirm-message'))
            .afterDismiss().pipe(filter(isConfirmed => isConfirmed))
            .subscribe(() => {
                const deleteProxy = storableRow.proxy();

                // decycles (i. e. deletes all complex members) the object so the apiService can build a JSON string
                for (const key of Object.keys(deleteProxy.data)) {
                    if (typeof deleteProxy.data[key] === 'object') {
                        deleteProxy.data[key] = null;
                    }
                }
                this.apiService.startOrder(
                    this.selectedRTC.toRuntimeContext(),
                    'xnwh.persistence.Delete',
                    [deleteProxy, new XoDeleteParameter()]
                ).subscribe({
                    error: error => {
                        console.error(error);
                        this.dialogService.error(error);
                    },
                    complete: () => {
                        this.refreshRows();
                    }
                });
            });
    }

    /**
     * @description Creates a storable based on the user input in a custom dialog
     */
    createStorable(): void {
        const structureTreeDataSource = new XcStructureTreeDataSource(this.apiService, this.i18nService, this.selectedRTC.toRuntimeContext(), [
            <XoDescriber>{ rtc: this.selectedRTC.toRuntimeContext(), fqn: this.selectedFQN }
        ]);
        structureTreeDataSource.refresh();
        this.dialogService
            .custom(StorableInstanceCreationComponent, {
                structureTreeDataSource,
                apiService: this.apiService,
                rtc: this.selectedRTC.toRuntimeContext(),
                storeParameter: new XoStoreParameter(),
                i18nService: this.i18nService
            })
            .afterDismiss()
            .subscribe((newInstance: boolean) => {
                if (newInstance) {
                    this.refreshRows();
                }
            });
    }

    canChooseFQN(): boolean {
        return this.selectedRTC && this.fqnDataWrapper.values.length > 0;
    }

    getFQNPlaceholder(): string {
        if (!this.fqnDataWrapper.values.length && this.selectedRTC && !this.isLoadingFQNs) {
            return this.i18nService.translate(this.NO_STORABLES_FOUND);
        }
        return this.i18nService.translate(this.SELECT_STORABLE_PLACEHOLDER);
    }

    /**
     * @description Refreshs rows of the local table
     */
    refreshRows(): void {
        this.storableTableSource.refresh();
        this.selectedRow = null;
        this.detailOpen = false;
        this.updateFQNDataWrapper();
    }

    canEditTable(): boolean {
        if (this.storableTableSource) {
            return this.storableTableSource.localTableData ? this.storableTableSource.localTableData.columns.length > 0 : false;
        }
        return false;
    }

    getDescriber(): XoDescriber {
        if (this.selectedRTC && this.selectedFQN) {
            return <XoDescriber>{ rtc: this.selectedRTC.toRuntimeContext(), fqn: this.selectedFQN };
        }
        return null;
    }

    onDetailClose(): void {
        this.detailOpen = false;
    }
}

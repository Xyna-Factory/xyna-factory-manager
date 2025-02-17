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
import { Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, NavigationExtras, Router } from '@angular/router';

import { ApiService, RuntimeContext, StartOrderResult, Xo, XoArray, XoArrayClassInterface, XoObject, XoObjectClassInterface } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { RouteComponent } from '@zeta/nav';
import { XcDialogService, XcRemoteDataSource, XcRemoteTableDataSource, XcSelectionDataSource } from '@zeta/xc';

import { Observable, Subject } from 'rxjs';

import { FactoryManagerSettingsService } from './misc/services/factory-manager-settings.service';


export interface InputScreenWorkflowPackage {
    List?: string;
    Details?: string;
    Add?: string;
    Save?: string;
    Delete?: string;
}


@Component({
    template: '',
    standalone: false
})
export class RestorableRouteComponent<T extends XoObject = XoObject, D = T> extends RouteComponent implements OnInit {

    private readonly _selectedEntryChange: Subject<T[]> = new Subject();
    private selectedEntry: T;

    private selectionDataSource: XcSelectionDataSource<T>;
    private clazz: XoObjectClassInterface;
    private orderType: string;

    rtc: RuntimeContext;
    detailsObject: D = null;
    refreshing = false;

    //#region - Factory Manager constants
    FM_DELETE_ENTRY_HEADER = 'fman.restorable-route.warning';
    //#endregion


    constructor(
        protected readonly apiService: ApiService,
        protected readonly dialogService: XcDialogService,
        protected readonly route: ActivatedRoute,
        protected readonly router: Router,
        protected readonly i18nService: I18nService,
        protected readonly injector: Injector,
        protected readonly settings: FactoryManagerSettingsService
    ) {
        super();

        router.events.subscribe(e => {
            // if selected table entry is not that inside the URL, reselect from URL
            if (e instanceof NavigationEnd) {
                const urlKey = this.readUniqueValue();
                const selectedKey = this.selectionDataSource?.selectionModel?.selection[0]?.uniqueKey;
                if ((!!urlKey || !!selectedKey) && urlKey !== selectedKey) {
                    this.selectionDataSource?.restoreSelectionKeys([urlKey]);
                }
            }
        });
    }


    ngOnInit() {
        super.ngOnInit();
        this.FM_DELETE_ENTRY_HEADER = this.i18nService.translate(this.FM_DELETE_ENTRY_HEADER);
    }


    private initSelectionDataSource(selectionDataSource: XcSelectionDataSource<T>) {
        this.selectionDataSource = selectionDataSource;
        this.selectionDataSource.selectionModel.selectionChange.subscribe(selectionModel => {
            this.selectedEntry = selectionModel.selection[0] || null;
            this.writeUniqueValues();
            this._selectedEntryChange.next(selectionModel.selection);
        });
        this.selectionDataSource.dataChange.subscribe(() => this.refreshing = false);
        this.selectionDataSource.restoreSelectionKeys([this.readUniqueValue()]);
    }


    protected initRemoteTableDataSource(clazz: XoObjectClassInterface<T>, output: XoArrayClassInterface<XoArray<T>>, rtc: RuntimeContext, orderType: string, input?: Xo | Xo[]) {
        this.clazz = clazz;
        this.orderType = orderType;
        this.rtc = rtc;
        const remoteTableDataSource = new XcRemoteTableDataSource<T>(this.apiService, this.i18nService, this.rtc, this.orderType);
        remoteTableDataSource.input = input;
        remoteTableDataSource.output = output;
        remoteTableDataSource.refreshOnFilterChange = this.settings.tableRefreshOnFilterChange;
        remoteTableDataSource.error.subscribe(result => console.error('Error happened while retrieving the table data', result));
        this.initSelectionDataSource(remoteTableDataSource);
    }


    protected initRemoteDataSource(clazz: XoObjectClassInterface<T>, output: XoArrayClassInterface<XoArray<T>>, rtc: RuntimeContext, orderType: string, input?: Xo | Xo[]) {
        this.clazz = clazz;
        this.orderType = orderType;
        this.rtc = rtc;
        this.initSelectionDataSource(new XcRemoteDataSource<T>(this.apiService, this.rtc, this.orderType, input, output));
    }


    protected clearSelection() {
        this.selectionDataSource.selectionModel.clear();
    }


    protected getUniqueKeys(): string[] {
        return this.clazz ? Array.from(this.clazz.prototype.uniqueProperties.values()) : [];
    }


    private readUniqueValue(): string {
        const uniqueKeys = this.getUniqueKeys();
        const uniqueValues: string[] = [];
        const qParams = this.route.snapshot.queryParams;
        const tmpInstance: T = new this.clazz.prototype.constructor();
        uniqueKeys.forEach(key => {
            const val = qParams[key];
            tmpInstance[key] = val;
            if (val) {
                uniqueValues.push(val);
            }
        });
        return tmpInstance.uniqueKey;
    }


    private writeUniqueValues() {
        const uniqueKeys = this.getUniqueKeys();
        const param = {};

        if (this.selectedEntry) {
            uniqueKeys.forEach(key => {
                Object.defineProperty(param, key, { 'value': this.selectedEntry[key], writable: true, enumerable: true, configurable: true });
            });
        } else {
            uniqueKeys.forEach(key => {
                Object.defineProperty(param, key, { 'value': '', writable: true, enumerable: true, configurable: true });
            });
        }

        const extras: NavigationExtras = {
            relativeTo: this.route,
            queryParams: param,
            queryParamsHandling: 'merge'
        };
        void this.router.navigate([], extras);
    }


    protected handleStartOrderResult(
        resObs: Observable<StartOrderResult>,
        handler: (output: any[]) => void,
        undefinedErrorMessage: string,
        finalizer?: () => void,
        onError?: (msg: string) => any
    ) {
        resObs.subscribe(
            result => {
                if (result && !result.errorMessage) {
                    handler(result.output);
                } else {
                    this.dialogService.error(this.i18nService.translateErrorCode(result.errorMessage));
                    if (onError) {
                        onError(result.errorMessage);
                    }
                    console.error(result);
                }
            },
            error => {
                this.dialogService.error(this.i18nService.translate(undefinedErrorMessage));
                if (onError) {
                    onError(undefinedErrorMessage);
                }
                console.error(error);
            },
            () => {
                finalizer?.();
            }
        );
    }


    refresh() {
        this.refreshing = true;
        this.selectionDataSource.refresh();
    }


    get selectedEntryChange(): Observable<T[]> {
        return this._selectedEntryChange.asObservable();
    }


    get remoteTableDataSource(): XcRemoteTableDataSource<T> {
        return this.selectionDataSource as XcRemoteTableDataSource<T>;
    }


    get remoteDataSource(): XcRemoteDataSource<T> {
        return this.selectionDataSource as XcRemoteDataSource<T>;
    }
}

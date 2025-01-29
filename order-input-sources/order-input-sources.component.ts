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
import { ChangeDetectorRef, Component, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService, StartOrderOptionsBuilder, XoApplication, XoArray, XoDescriber } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcDialogService } from '@zeta/xc';

import { Subject } from 'rxjs';
import { filter, skip } from 'rxjs/operators';

import { FM_RTC } from '../const';
import { FactoryManagerSettingsService } from '../misc/services/factory-manager-settings.service';
import { AddNewOrderInputSourceModalComponent, AddNewOrderInputSourceModalComponentData } from './modal/add-new-order-input-source-modal/add-new-order-input-source-modal.component';
import { OrderInputSourceCloseEvent } from './order-input-source-details/order-input-source-details.component';
import { ORDER_INPUT_SOURCE_ISWP, RestorableOrderInputSourcesComponent } from './restorable-order-input-sources.component';
import { XoGetOrderInputSourceRequest } from './xo/xo-get-order-input-source-request.model';
import { XoOrderInputSourceId } from './xo/xo-order-input-source-id.model';
import { XoOrderInputSource, XoOrderInputSourceArray } from './xo/xo-order-input-source.model';


const ISWP = ORDER_INPUT_SOURCE_ISWP;


export interface InputDataTypesTreeData {
    inputDescriberArray: XoDescriber[];
    respectiveContainer: XoArray;
}


@Component({
    templateUrl: './order-input-sources.component.html',
    styleUrls: ['./order-input-sources.component.scss'],
    standalone: false
})
export class OrderInputSourcesComponent extends RestorableOrderInputSourcesComponent {

    // FIXME: USE CODE FROM ADD NEW ORDER INPUT SOURCE MODAL !!!!!

    constructor(
        apiService: ApiService,
        dialogService: XcDialogService,
        route: ActivatedRoute,
        router: Router,
        i18nService: I18nService,
        settings: FactoryManagerSettingsService,
        injector: Injector,
        private readonly cdr: ChangeDetectorRef
    ) {
        super(apiService, dialogService, route, router, i18nService, injector, settings);
        this.initRemoteTableDataSource(XoOrderInputSource, XoOrderInputSourceArray, FM_RTC, ISWP.List);

        this.refresh();

        this.selectedEntryChange.pipe(filter(selection => !!selection?.length)).subscribe(
            selection => this.detailsObject = selection[0]
        );

        this.remoteTableDataSource.actionElements = [
            {
                class: 'delete-action-element',
                iconName: 'delete',
                tooltip: this.i18nService.translate('fman.ois.delete'),
                onAction: this.delete.bind(this)
            },
            {
                class: 'copy-action-element',
                iconName: 'copy',
                tooltip: this.i18nService.translate('fman.ois.duplicate'),
                onAction: this.duplicate.bind(this)
            }
        ];
    }


    onShow() {
        super.onShow();

        // only handle restore-fail once on show
        const restoreSubscription = this.remoteTableDataSource.restoreSelectionKeysFailed.subscribe(selectionKeys => {
            restoreSubscription.unsubscribe();

            // close details
            this.dismiss();

            // refresh with set filters, as soon as filters have been set
            const filtersReady = new Subject<void>();
            filtersReady.subscribe(() => this.remoteTableDataSource.refresh());

            // handle filtered refresh
            const refreshSubscription = this.remoteTableDataSource.dataChange
                .pipe(skip(1)) // skip current (pre-refresh) value of data-source
                .subscribe(() => {
                    /** @todo this subscription is called too early. Not for the refresh of the line before, but for the refresh before that */
                    this.remoteTableDataSource.restoreSelectionKeys(selectionKeys);
                    if (refreshSubscription) {
                        refreshSubscription.unsubscribe();
                    }
                });

            // prepare filters for refresh
            const uniqueKeys = this.getUniqueKeys();
            const values = selectionKeys.length > 0 ? selectionKeys : [];
            let revision: string;
            for (let i = 0; i < uniqueKeys.length; i++) {
                if (uniqueKeys[i] === 'revision') {
                    revision = values[i] || '';
                } else {
                    this.remoteTableDataSource.setFilter(uniqueKeys[i], /^,+$/.exec(values[i]) ? '' : values[i]);    // ignore empty values like ','
                }
            }
            // handle special revision filter
            if (revision !== undefined) {
                // find RTC by revision-ID
                this.apiService.getRuntimeContexts(true).subscribe(rtcs => {
                    const desiredRtc = rtcs.find(rtc => String(rtc.revision) === revision);
                    let workspace = '';
                    let application = '';
                    let version = '';
                    if (!desiredRtc || desiredRtc.isWorkspace) {
                        workspace = desiredRtc
                            ? desiredRtc.toRuntimeContext().uniqueKey
                            : this.apiService.runtimeContext ? this.apiService.runtimeContext.uniqueKey : '';
                    } else if (desiredRtc.isApplication) {
                        application = desiredRtc.name;
                        version = (desiredRtc as XoApplication).versionName;
                    }

                    this.remoteTableDataSource.setFilter('workspaceName', workspace);
                    this.remoteTableDataSource.setFilter('applicationName', application);
                    this.remoteTableDataSource.setFilter('versionName', version);
                    filtersReady.next();
                    filtersReady.complete();
                });
            } else {
                filtersReady.next();
                filtersReady.complete();
            }
        });

        // check if there has to be made a selection restore from the route
        const qParams = this.route.snapshot.queryParams;
        const keys = [];
        let needsRestore = false;
        for (const key in qParams) {
            if (Object.prototype.hasOwnProperty.call(qParams, key)) {
                if (qParams[key]) {
                    needsRestore = true;
                }
                keys.push(qParams[key]);
            }
        }
        if (needsRestore) {
            this.remoteTableDataSource.restoreSelectionKeys(keys);
        }
    }


    add(duplicated: XoOrderInputSource = null) {
        const data: AddNewOrderInputSourceModalComponentData = {
            addWorkflow: ISWP.Add,
            getOrderSourceTypesWorkflow: ISWP.GetOrderSourceTypes,
            getOrderTypes: ISWP.GetOrderTypes,
            getGeneratingOrderTypes: ISWP.GetGeneratingOrderTypes,
            i18nService: this.i18nService,
            rtc: FM_RTC,
            duplicate: duplicated,
            // eslint-disable-next-line @typescript-eslint/unbound-method
            GET_GENERATING_ORDER_TYPES_EMPTY_LIST_ERROR: this.GET_GENERATING_ORDER_TYPES_EMPTY_LIST_ERROR,
            GET_GENERATING_ORDER_TYPES_ERROR: this.GET_GENERATING_ORDER_TYPES_ERROR,
            // eslint-disable-next-line @typescript-eslint/unbound-method
            GET_ORDER_TYPES_EMPTY_LIST_ERROR: this.GET_ORDER_TYPES_EMPTY_LIST_ERROR,
            UNSPECIFIED_GET_ORDER_TYPES_ERROR: this.UNSPECIFIED_GET_ORDER_TYPES_ERROR,
            UNSPECIFIED_GET_RUNTIME_CONTEXTS_ERROR: this.UNSPECIFIED_GET_RUNTIME_CONTEXTS_ERROR
        };

        this.dialogService.custom<boolean, AddNewOrderInputSourceModalComponentData>(AddNewOrderInputSourceModalComponent, data).afterDismissResult()
            .pipe(filter(result => !!result))
            .subscribe(() => this.refresh());
    }


    duplicate(entry: XoOrderInputSource) {
        const request = new XoGetOrderInputSourceRequest();
        request.inputSourceName = entry.name;
        request.revision = entry.revision;

        const obs = this.apiService.startOrder(FM_RTC, ISWP.Details, request, XoOrderInputSource, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
        this.handleStartOrderResult(obs, output => {
            const detailedEntry = (output[0] || null) as XoOrderInputSource;
            this.add(detailedEntry);

        }, this.UNSPECIFIED_DETAILS_ERROR);
    }


    delete(entry: XoOrderInputSource) {
        this.dialogService.confirm(
            this.i18nService.translate(this.FM_DELETE_ENTRY_HEADER),
            this.i18nService.translate(this.CONFIRM_DELETE, { key: '$0', value: entry.name })
        ).afterDismissResult().subscribe(
            value => {
                if (value) {
                    if (entry instanceof XoOrderInputSource) {
                        const id = new XoOrderInputSourceId();
                        id.id = entry.id;
                        const obs = this.apiService.startOrder(FM_RTC, ISWP.Delete, id, null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
                        this.handleStartOrderResult(obs, () => {
                            this.detailsObject = null;
                            this.clearSelection();
                            this.refresh();
                        }, this.UNSPECIFIED_DETAILS_ERROR);
                    }
                }
            }
        );
    }


    dismiss(event?: OrderInputSourceCloseEvent) {
        this.detailsObject = null;
        this.clearSelection();
        if (event?.dataChanged) {
            this.refresh();
        }
    }
}

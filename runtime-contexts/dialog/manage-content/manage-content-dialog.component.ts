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
import { Component, Injector, OnDestroy } from '@angular/core';

import { XoDependencyType } from '@fman/runtime-contexts/xo/xo-dependency.model';
import { XoGetApplicationContentRequest } from '@fman/runtime-contexts/xo/xo-get-application-content-request.model';
import { ApiService, StartOrderOptionsBuilder } from '@zeta/api';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XcDialogComponent, XcDialogService, XcLocalTableDataSource, XcRemoteTableDataSource } from '@zeta/xc';

import { Subscription, throwError } from 'rxjs';
import { catchError, filter, finalize, first, skip, tap } from 'rxjs/operators';

import { FM_RTC } from '../../../const';
import { FactoryManagerSettingsService } from '../../../misc/services/factory-manager-settings.service';
import { createContentTableInfoClass } from '../../content';
import { ORDER_TYPES } from '../../order-types';
import { XoApplicationDefinition } from '../../xo/xo-application-definition.model';
import { XoApplicationElement, XoApplicationElementArray } from '../../xo/xo-application-element.model';
import { XoRuntimeApplication } from '../../xo/xo-runtime-application.model';
import { XoRuntimeContext } from '../../xo/xo-runtime-context.model';
import { manageContent_translations_de_DE } from './locale/manage-content-translations.de-DE';
import { manageContent_translations_en_US } from './locale/manage-content-translations.en-US';


@Component({
    templateUrl: './manage-content-dialog.component.html',
    styleUrls: ['./manage-content-dialog.component.scss'],
    standalone: false
})
export class ManageContentDialogComponent extends XcDialogComponent<boolean, XoRuntimeContext> implements OnDestroy {

    dataSource: XcRemoteTableDataSource<XoApplicationElement>;
    changedContentTable: XcLocalTableDataSource;
    includeIndependent = true;
    includeImplicit = false;
    includeIndirect = false;
    loading: boolean;

    readonly changedApplicationElements = new Map<string, XoApplicationElement>();
    readonly subscriptions = new Array<Subscription>();


    constructor(injector: Injector, private readonly apiService: ApiService, private readonly dialogService: XcDialogService, private readonly i18n: I18nService, private readonly settings: FactoryManagerSettingsService) {
        super(injector);

        this.i18n.setTranslations(LocaleService.DE_DE, manageContent_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, manageContent_translations_en_US);

        // create data source
        this.dataSource = new XcRemoteTableDataSource(this.apiService, undefined, FM_RTC, ORDER_TYPES.GET_APPLICATION_CONTENT, createContentTableInfoClass(!this.readonly));
        // this.dataSource.actionElements = [
        //     {
        //         class: 'delete-action-element',
        //         iconName: 'delete',
        //         tooltip: this.i18n.translate('xfm.fman.rtcs.manage-content-table-open'),
        //         onAction: this.openInProcessModeller.bind(this)
        //     }
        // ];
        this.updateDataSource();


        // create summary data source
        this.changedContentTable = new XcLocalTableDataSource();
        this.changedContentTable.localTableData = {
            rows: [],
            columns: [
                {path: 'changeTemplate', name: this.i18n.translate('xfm.fman.rtcs.manage-content.table.changes'), disableFilter: true, disableSort: true, shrink: true},
                {path: 'name', name: this.i18n.translate('xfm.fman.rtcs.manage-content.table.name')},
                {path: 'elementType', name: this.i18n.translate('xfm.fman.rtcs.manage-content.table.rtc')}
            ]
        };
        this.changedContentTable.refreshOnFilterChange = this.settings.tableRefreshOnFilterChange;
    }


    ngOnDestroy() {
        this.unsubscribe();
    }


    updateDataSource() {
        this.dataSource.input = XoGetApplicationContentRequest.create(this.injectedData, this.includeIndependent, this.includeImplicit, this.includeIndirect);
        this.dataSource.output = XoApplicationElementArray;
        this.dataSource.refreshOnFilterChange = this.settings.tableRefreshOnFilterChange;
        this.dataSource.dataChange.subscribe(this.dataChange.bind(this));
        this.dataSource.dataChange.pipe(skip(1), first()).subscribe(() => {
            if (!this.includeIndependent) {
                this.changedApplicationElements.forEach(applicationElement => {
                    if (applicationElement.dependencyType !== XoDependencyType.INDEPENDENT) {
                        this.dataSource.add(applicationElement);
                    }
                });
            }
            this.dataSource.triggerMarkForChange();
        });
        this.dataSource.refresh();
    }


    private unsubscribe() {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
        this.subscriptions.splice(0, this.subscriptions.length);
    }


    private dataChange(applicationElements: XoApplicationElement[]) {
        this.unsubscribe();
        applicationElements.forEach(applicationElement => {
            // subscribe to dependency type changes
            this.subscriptions.push(
                applicationElement.dependencyTypeChange.subscribe(
                    this.dependencyTypeChange.bind(this)
                )
            );
            // use dependency type from changed dependency, if available
            const changedApplicationElement = this.changedApplicationElements.get(applicationElement.uniqueKey);
            if (changedApplicationElement) {
                applicationElement.dependencyType = changedApplicationElement.dependencyType;
                applicationElement.updateTemplate();
            }
        });
    }


    private openInProcessModeller(item: XoApplicationElement) {
        const rtc = item.originRTC;
        const fqn = item.fqn;
        const type = item.elementType;
        console.log(JSON.stringify({rtc, fqn, type}));
        console.log(rtc);
        console.log(item);

        window.history.pushState({}, null, 'xfm/Process-Modeller?tab1=' + encodeURI(JSON.stringify({rtc, fqn, type})));
    }


    private dependencyTypeChange(applicationElement: XoApplicationElement) {
        if (applicationElement.dependencyTypeModified) {
            this.changedApplicationElements.set(applicationElement.uniqueKey, applicationElement);
        } else {
            this.changedApplicationElements.delete(applicationElement.uniqueKey);
        }

        this.changedContentTable.localTableData.rows = [];
        this.changedApplicationElements.forEach(changedApplicationElement => this.changedContentTable.localTableData.rows.push(changedApplicationElement));
        this.changedContentTable.refresh();
    }


    apply() {
        this.loading = true;
        const applicationElements = new XoApplicationElementArray();
        applicationElements.data.push(...Array.from(this.changedApplicationElements.values()));

        this.apiService.startOrder(FM_RTC, ORDER_TYPES.SET_AD_CONTENT, [this.injectedData.proxy(), applicationElements], undefined, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).pipe(
            catchError((error: any) => {
                this.dismiss();
                return throwError(error);
            }),
            tap(result => this.dismiss(!result.errorMessage ? true : undefined)),
            filter(result => !!result.errorMessage),
            tap(result => this.dialogService.error(result.errorMessage, null, result.stackTrace.join('\r\n'))),
            finalize(() => {
                this.loading = false;
            })
        ).subscribe();
    }


    get titleKey(): string {
        if (this.injectedData instanceof XoApplicationDefinition) {
            return 'manage-content-title-application-definition';
        }
        if (this.injectedData instanceof XoRuntimeApplication) {
            return 'view-content-title-runtime-application';
        }
        return '';
    }


    get readonly(): boolean {
        return this.injectedData instanceof XoRuntimeApplication;
    }
}

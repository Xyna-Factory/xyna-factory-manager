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
import { XoForce } from '@yggdrasil/force.model';

import { ApiService, StartOrderOptionsBuilder } from '@zeta/api';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XcDialogComponent, XcDialogService, XcLocalTableDataSource, XcRemoteTableDataSource } from '@zeta/xc';

import { Observable, Subscription, throwError } from 'rxjs';
import { catchError, filter, finalize, first, map, skip, switchMap } from 'rxjs/operators';

import { FM_RTC } from '../../../const';
import { FactoryManagerSettingsService } from '../../../misc/services/factory-manager-settings.service';
import { createDependenciesTableInfoClass, createDependenciesTableInput, createFilterEnumOfState } from '../../dependencies';
import { ORDER_TYPES } from '../../order-types';
import { XoApplicationDefinition } from '../../xo/xo-application-definition.model';
import { XoDependency, XoDependencyArray, XoDependencyType } from '../../xo/xo-dependency.model';
import { XoReferenceDirectionForward } from '../../xo/xo-reference-direction-forward.model';
import { XoRuntimeApplication } from '../../xo/xo-runtime-application.model';
import { XoRuntimeContext } from '../../xo/xo-runtime-context.model';
import { XoWorkspace } from '../../xo/xo-workspace.model';
import { manageDependencies_translations_de_DE } from './locale/manage-dependencies-translations.de-DE';
import { manageDependencies_translations_en_US } from './locale/manage-dependencies-translations.en-US';


@Component({
    templateUrl: './manage-dependencies-dialog.component.html',
    styleUrls: ['./manage-dependencies-dialog.component.scss'],
    standalone: false
})
export class ManageDependenciesDialogComponent extends XcDialogComponent<boolean, XoRuntimeContext> implements OnDestroy {

    dataSource: XcRemoteTableDataSource<XoDependency>;
    changedDependencyTable: XcLocalTableDataSource;
    includeIndependent = true;
    includeImplicit = false;
    loading: boolean;

    readonly changedDependencies = new Map<string, XoDependency>();
    readonly subscriptions = new Array<Subscription>();


    constructor(injector: Injector, private readonly apiService: ApiService, private readonly dialogService: XcDialogService, private readonly i18n: I18nService, private readonly settings: FactoryManagerSettingsService) {
        super(injector);

        this.i18n.setTranslations(LocaleService.DE_DE, manageDependencies_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, manageDependencies_translations_en_US);

        // create data source
        this.dataSource = new XcRemoteTableDataSource(this.apiService, undefined, FM_RTC, ORDER_TYPES.GET_DEPENDENT_RTCS, createDependenciesTableInfoClass(true));
        this.dataSource.output = XoDependencyArray;
        this.dataSource.refreshOnFilterChange = this.settings.tableRefreshOnFilterChange;
        this.dataSource.filterEnums.set(XoDependency.getAccessorMap().runtimeContext.stateTemplates, createFilterEnumOfState(this.i18n));
        this.dataSource.dataChange.subscribe(this.dataChange.bind(this));
        this.updateDataSource();

        // create summary data source
        this.changedDependencyTable = new XcLocalTableDataSource();
        this.changedDependencyTable.localTableData = {
            rows: [],
            columns: [
                {path: 'changeTemplate', name: this.i18n.translate('xfm.fman.rtcs.manage-dependencies.table.changes'), disableFilter: true, disableSort: true, shrink: true},
                {path: 'nameTemplates', name: this.i18n.translate('xfm.fman.rtcs.manage-dependencies.table.name')},
                {path: 'rtcType', name: this.i18n.translate('xfm.fman.rtcs.manage-dependencies.table.rtc')}
            ]
        };
        this.changedDependencyTable.refreshOnFilterChange = this.settings.tableRefreshOnFilterChange;
    }


    ngOnDestroy() {
        this.unsubscribe();
    }


    updateDataSource() {
        this.dataSource.input = createDependenciesTableInput(this.injectedData, new XoReferenceDirectionForward(), this.includeIndependent, this.includeImplicit);
        this.dataSource.dataChange.pipe(skip(1), first()).subscribe(() => {
            if (!this.includeIndependent) {
                this.changedDependencies.forEach(dependency => {
                    if (dependency.dependencyType !== XoDependencyType.INDEPENDENT) {
                        this.dataSource.add(dependency);
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


    private dataChange(dependencies: XoDependency[]) {
        this.unsubscribe();
        dependencies.forEach(dependency => {
            // subscribe to dependency type changes
            this.subscriptions.push(
                dependency.dependencyTypeChange.subscribe(
                    this.dependencyTypeChange.bind(this)
                )
            );
            // use dependency type from changed dependency, if available
            const changedDependency = this.changedDependencies.get(dependency.uniqueKey);
            if (changedDependency) {
                dependency.dependencyType = changedDependency.dependencyType;
                dependency.updateTemplate();
            }
        });
    }


    private dependencyTypeChange(dependency: XoDependency) {
        if (dependency.dependencyTypeModified) {
            this.changedDependencies.set(dependency.uniqueKey, dependency);
        } else {
            this.changedDependencies.delete(dependency.uniqueKey);
        }

        this.changedDependencyTable.localTableData.rows = [];
        this.changedDependencies.forEach(changedDependency => this.changedDependencyTable.localTableData.rows.push(changedDependency));
        this.changedDependencyTable.refresh();
    }


    apply(force = false): Observable<boolean> {
        this.loading = true;
        const dependencies = new XoDependencyArray();
        dependencies.data.push(...Array.from(this.changedDependencies.values()));

        return this.apiService.startOrder(FM_RTC, ORDER_TYPES.SET_DEPENDENT_RTCS, [this.injectedData.proxy(), dependencies, XoForce.withForce(force)], undefined, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).pipe(
            catchError((error: any) => {
                this.dismiss();
                return throwError(error);
            }),
            map(result => {
                if (!result.errorMessage || result.errorMessage && force) {
                    this.dismiss(true);
                    if (result.errorMessage) {
                        this.dialogService.error(result.errorMessage, null, result.stackTrace.join('\r\n'));
                    }
                    return null;
                }
                return result.errorMessage;
            }),
            // continue, when there is an error and the user didn't use the force, yet
            filter(error => !!error),
            switchMap(error => {
                // confirm to use the force
                const title = this.i18n.translate('Confirm');
                const message = this.i18n.translate('xfm.fman.rtcs.manage-dependencies.force-message', { key: '$0', value: error });
                return this.dialogService.confirm(title, message).afterDismissResult().pipe(
                    filter(confirmed => !!confirmed),
                    switchMap(() => this.apply(true))
                );
            }),
            finalize(() => {
                this.loading = false;
            })
        );
    }


    get titleKey(): string {
        if (this.injectedData instanceof XoWorkspace) {
            return 'manage-dependencies-title-workspace';
        }
        if (this.injectedData instanceof XoApplicationDefinition) {
            return 'manage-dependencies-title-application-definition';
        }
        if (this.injectedData instanceof XoRuntimeApplication) {
            return 'manage-dependencies-title-runtime-application';
        }
        return '';
    }
}

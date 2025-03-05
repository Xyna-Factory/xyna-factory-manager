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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { TileDataSource, TileItem } from '@fman/runtime-contexts/shared/tile/tile-data-source';

import { ApiService, StartOrderOptionsBuilder } from '@zeta/api';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XcComponentTemplate, XcDialogService, XcSelectionModel, XcTemplate } from '@zeta/xc';
import { Comparable } from '@zeta/base';
import { ORDER_TYPES } from './order-types';
import { FM_RTC } from '@fman/const';
import { XoFilter, XoFilterArray } from './xo/xo-filter.model';
import { FilterDetailComponent } from './components/filter-detail/filter-detail.component';
import { FilterInstanceDetailComponent } from './components/filter-instance-detail/filter-instance-detail.component';
import { XoFilterInstance } from './xo/xo-filter-instance.model';
import { Subscription } from 'rxjs';
import { ActionButtonData } from '@fman/runtime-contexts/shared/tile/tile.component';
import { DeployFilterDialogComponent } from './components/deploy-filter-dialog/deploy-filter-dialog.component';
import { trigger_and_filter_translations_de_DE } from './locale/trigger-and-filter-translations.de-DE';
import { trigger_and_filter_translations_en_US } from './locale/trigger-and-filter-translations.en-US';
import { RouteComponent } from '@zeta/nav';

class FilterTile extends Comparable implements TileItem {

    private template: XcTemplate;

    constructor(private readonly filter: XoFilter) {
        super();
    }

    getDetailTemplate(): XcTemplate {
        if (!this.template) {
            this.template = new XcComponentTemplate(FilterDetailComponent, this.filter);
        }
        return this.template;
    }
    getLabel(): string {
        return this.filter.name;
    }
    getCursiveLabel(): string {
        return this.filter.runtimeContext.label;
    }
    getIcon(): XcTemplate {
        return this.filter.stateTemplate;
    }
    get uniqueKey(): string {
        return ':filter:' + this.filter.name + ':rtc:' + this.filter.runtimeContext.label;
    }
}

class FilterInstanceTile extends Comparable implements TileItem {

    private template: XcTemplate;

    constructor(private readonly filterInstance: XoFilterInstance, private readonly refresh: () => void) {
        super();
    }

    getDetailTemplate(): XcTemplate {
        if (!this.template) {
            this.template = new XcComponentTemplate(FilterInstanceDetailComponent, {filterinstance: this.filterInstance, refresh: this.refresh});
        }
        return this.template;
    }
    getLabel(): string {
        return this.filterInstance.filterInstance;
    }
    getCursiveLabel(): string {
        return this.filterInstance.runtimeContext.label;
    }
    getIcon(): XcTemplate {
        return this.filterInstance.stateTemplate;
    }
    get uniqueKey(): string {
        return ':instance:' + this.filterInstance.filterInstance + ':rtc:' + this.filterInstance.runtimeContext.label;
    }
}

@Component({
    templateUrl: './filter.component.html',
    styleUrls: ['./filter.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class FilterComponent extends RouteComponent {

    refreshing = false;
    datasources: TileDataSource[];
    private subscription: Subscription[] = [];
    deployButton: ActionButtonData = {  iconName: 'add', tooltip: 'deploy'  };
    selectionModel: XcSelectionModel<TileItem> = new XcSelectionModel<TileItem>();

    constructor(
        private readonly apiService: ApiService,
        private readonly cdr: ChangeDetectorRef,
        private readonly i18nService: I18nService,
        private readonly dialogService: XcDialogService) {
        super();

        this.i18nService.setTranslations(LocaleService.DE_DE, trigger_and_filter_translations_de_DE);
        this.i18nService.setTranslations(LocaleService.EN_US, trigger_and_filter_translations_en_US);

        this.refresh();
    }

    refresh() {
        this.refreshing = true;
        this.apiService.startOrder(FM_RTC, ORDER_TYPES.FILTER_OVERVIEW, [], XoFilterArray, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage)
            .subscribe({
                next: result => {
                    if (result && !result.errorMessage) {
                        this.unSubscribe();
                        const filters: XoFilter[] = (result.output[0] as XoFilterArray).data;
                        this.datasources = filters.map(filter => this.buildTileDatasource(filter));

                    } else {
                        this.dialogService.error(result.errorMessage);
                    }
                },
                error: err => {
                    this.dialogService.error(err);
                },
                complete: () => {
                    this.refreshing = false;
                    this.cdr.markForCheck();
                }
            });
    }

    private buildTileDatasource(filter: XoFilter): TileDataSource {
        const result = new TileDataSource(this.selectionModel,
            [new FilterTile(filter)],
            filter.filterInstance.data.map(instance => new FilterInstanceTile(instance, this.refresh.bind(this)))
        );
        this.subscription.push(result.actionPressed.subscribe({
            next: () => {
                this.deployFilterInstance(filter);
            }
        }));
        return result;
    }

    private unSubscribe() {
        this.subscription.forEach(sub => sub.unsubscribe());
        this.subscription = [];
    }

    private deployFilterInstance(filter: XoFilter) {

        this.dialogService.custom<XoFilterInstance, XoFilter, DeployFilterDialogComponent>(DeployFilterDialogComponent, filter).afterDismissResult().subscribe(instance => {
            if (instance) {
                this.refresh();
            }
        });
    }
}


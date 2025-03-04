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
import { Subscription } from 'rxjs';
import { ActionButtonData } from '@fman/runtime-contexts/shared/tile/tile.component';
import { XoTriggerInstance } from './xo/xo-trigger-instance.model';
import { TriggerInstanceDetailComponent } from './components/trigger-instance-detail/trigger-instance-detail.component';
import { TriggerDetailComponent } from './components/trigger-detail/trigger-detail.component';
import { XoTrigger, XoTriggerArray } from './xo/xo-trigger.model';
import { DeployTriggerDialogComponent } from './components/deploy-trigger-dialog/deploy-trigger-dialog.component';
import { trigger_and_filter_translations_de_DE } from './locale/trigger-and-filter-translations.de-DE';
import { trigger_and_filter_translations_en_US } from './locale/trigger-and-filter-translations.en-US';
import { RouteComponent } from '@zeta/nav';

class TriggerTile extends Comparable implements TileItem {

    private template: XcTemplate;

    constructor(private readonly trigger: XoTrigger) {
        super();
    }

    getDetailTemplate(): XcTemplate {
        if (!this.template) {
            this.template = new XcComponentTemplate(TriggerDetailComponent, this.trigger);
        }
        return this.template;
    }
    getLabel(): string {
        return this.trigger.name;
    }
    getCursiveLabel(): string {
        return this.trigger.runtimeContext.label;
    }
    getIcon(): XcTemplate {
        return this.trigger.stateTemplate;
    }
    get uniqueKey(): string {
        return ':trigger:' + this.trigger.name + ':rtc:' + this.trigger.runtimeContext.label;
    }
}

class TriggerInstanceTile extends Comparable implements TileItem {

    private template: XcTemplate;

    constructor(private readonly triggerInstance: XoTriggerInstance, private readonly refresh: () => void) {
        super();
    }

    getDetailTemplate(): XcTemplate {
        if (!this.template) {
            this.template = new XcComponentTemplate(TriggerInstanceDetailComponent, {triggerinstance: this.triggerInstance, refresh: this.refresh});
        }
        return this.template;
    }
    getLabel(): string {
        return this.triggerInstance.triggerInstance;
    }
    getCursiveLabel(): string {
        return this.triggerInstance.runtimeContext.label;
    }
    getIcon(): XcTemplate {
        return this.triggerInstance.stateTemplate;
    }
    get uniqueKey(): string {
        return ':instance:' + this.triggerInstance.triggerInstance + ':rtc:' + this.triggerInstance.runtimeContext.label;
    }
}

@Component({
    templateUrl: './trigger.component.html',
    styleUrls: ['./trigger.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class TriggerComponent extends RouteComponent {

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
        this.apiService.startOrder(FM_RTC, ORDER_TYPES.TRIGGER_OVERVIEW, [], XoTriggerArray, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage)
            .subscribe({
                next: result => {
                    if (result && !result.errorMessage) {
                        this.unSubscribe();
                        const triggers: XoTrigger[] = (result.output[0] as XoTriggerArray).data;
                        this.datasources = triggers.map(trigger => this.buildTileDatasource(trigger));

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

    private buildTileDatasource(trigger: XoTrigger): TileDataSource {
        const result = new TileDataSource(this.selectionModel,
            [new TriggerTile(trigger)],
            trigger.triggerInstance.data.map(instance => new TriggerInstanceTile(instance, this.refresh.bind(this)))
        );
        this.subscription.push(result.actionPressed.subscribe({
            next: () => {
                this.deployTriggerInstance(trigger);
            }
        }));
        return result;
    }

    private unSubscribe() {
        this.subscription.forEach(sub => sub.unsubscribe());
        this.subscription = [];
    }

    private deployTriggerInstance(trigger: XoTrigger) {

        this.dialogService.custom<XoTriggerInstance, XoTrigger, DeployTriggerDialogComponent>(DeployTriggerDialogComponent, trigger).afterDismissResult().subscribe(instance => {
            if (instance) {
                this.refresh();
            }
        });
    }
}


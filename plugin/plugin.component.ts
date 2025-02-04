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
import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ApiService, StartOrderOptionsBuilder } from '@zeta/api';
import { RouteComponent } from '@zeta/nav';
import { DefinitionStackItemComponentData, XcComponentTemplate, XcDefinitionStackItemComponent } from '@zeta/xc';
import { XoFormDefinition } from '@zeta/xc/xc-form/definitions/xo/containers.model';
import { XcStackDataSource } from '@zeta/xc/xc-stack/xc-stack-data-source';
import { XcStackItem } from '@zeta/xc/xc-stack/xc-stack-item/xc-stack-item';

import { filter, Subscription, take } from 'rxjs';

import { PluginService } from './plugin.service';


@Component({
    selector: 'plugin',
    templateUrl: './plugin.component.html',
    styleUrls: ['./plugin.component.scss']
})
export class PluginComponent extends RouteComponent implements OnDestroy {

    readonly stackDataSource = new XcStackDataSource();
    private readonly subscription: Subscription;

    active = false;


    constructor(
        api: ApiService,
        pluginService: PluginService,
        protected cdr: ChangeDetectorRef,
        route: ActivatedRoute
    ) {
        super();

        // get plugin for route
        route.data.pipe(
            take(1),
            filter(data => data.title)
        ).subscribe(data => {
            pluginService.plugins.pipe(filter(plugins => !!plugins)).subscribe(plugins => {
                const plugin = plugins.get(data.title);

                // get definition
                api.startOrder(
                    plugin.pluginRTC.toRuntimeContext(),
                    plugin.definitionWorkflowFQN,
                    null,
                    null,
                    StartOrderOptionsBuilder.defaultOptionsWithErrorMessage
                ).subscribe(response => {
                    const formDefinition = response.output[0] as XoFormDefinition;
                    const detailData = response.output.slice(1);

                    // create stack item
                    const item = new XcStackItem();
                    item.setTemplate(new XcComponentTemplate(
                        XcDefinitionStackItemComponent,
                        <DefinitionStackItemComponentData>{ stackItem: item, definition: formDefinition, data: detailData }
                    ));
                    this.stackDataSource.add(item);
                });
            });
        });

        this.subscription = this.stackDataSource.stackItemsChange.subscribe(() =>
            cdr.markForCheck()
        );
    }


    ngOnDestroy() {
        this.subscription.unsubscribe();
    }


    defaultTitle(): string {
        return '<unnamed>';
    }


    onShow() {
        super.onShow();

        this.active = true;
        this.cdr.markForCheck();
    }


    onHide() {
        this.active = false;

        /*
         * REMARK
         * For some reason, "detectChanges" instead of "markForCheck" has to be called here
         * to get the active state into the stack
         */
        this.cdr.detectChanges();
    }
}

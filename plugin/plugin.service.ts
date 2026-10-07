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

import { Injectable, inject } from '@angular/core';

import { FACTORY_MANAGER } from '@fman/const';
import { FMAN_RTC } from '@fman/factory-manager.component';
import { ApiService, StartOrderOptionsBuilder, StartOrderResult, Xo } from '@zeta/api';
import { XoPlugin, XoPluginArray } from '@zeta/xc';
import { XoPluginPath, XoPluginPathArray } from '@zeta/xc/xc-form/definitions/xo/plugin-path.model';

import { BehaviorSubject, catchError, filter, finalize, map, Observable, of } from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class PluginService {
    private readonly api = inject(ApiService);


    private readonly _plugins = new BehaviorSubject<Map<string, XoPlugin>>(null);
    private pending = false;


    get plugins(): Observable<Map<string, XoPlugin>> {

        // request plugins
        if (!this._plugins.getValue() && !this.pending) {
            this.pending = true;

            const paths: XoPluginPathArray = new XoPluginPathArray();
            paths.append(new XoPluginPath()).append(new XoPluginPath());
            paths.data[1].path = 'manager';
            this.api.startOrder(
                FMAN_RTC,
                'xmcp.forms.plugin.FilterPluginsByPaths',
                [paths], undefined, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage
            ).pipe(
                catchError(() =>
                    of(<StartOrderResult<Xo>>{orderId: 'error'})
                ),
                filter(response => !!response.output),
                map(response => {
                    const pluginList = response.output[0] as XoPluginArray;
                    const pluginMap = new Map<string, XoPlugin>();
                    pluginList.data.forEach((plugin: XoPlugin, index) => pluginMap.set(FACTORY_MANAGER.PLUGIN + '-' + index, plugin));
                    this._plugins.next(pluginMap);
                }),
                finalize(() => this.pending = false)
            ).subscribe();
        }

        return this._plugins.asObservable();
    }
}

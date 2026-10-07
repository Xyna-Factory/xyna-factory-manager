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

import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { FACTORY_MANAGER } from '@fman/const';
import { ApiService, StartOrderOptionsBuilder, StartOrderResult, Xo } from '@zeta/api';
import { XoPlugin, XoPluginArray } from '@zeta/xc';
import { XoPluginPath, XoPluginPathArray } from '@zeta/xc/xc-form/definitions/xo/plugin-path.model';
import { BehaviorSubject, catchError, filter, finalize, map, Observable, of } from 'rxjs';

@Injectable()
export class PluginService {

    private readonly _plugins = new BehaviorSubject<Map<string, XoPlugin>>(null);
    private pending = false;

    constructor(private readonly api: ApiService) {
    }


    get plugins(): Observable<Map<string, XoPlugin>> {

        // request plugins
        if (!this._plugins.getValue() && !this.pending) {
            this.pending = true;

            const paths: XoPluginPathArray = new XoPluginPathArray();
            paths.append(new XoPluginPath()).append(new XoPluginPath());
            paths.data[1].path = 'manager';
            this.api.startOrder(
                environment.zeta.xo.runtimeContext,
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

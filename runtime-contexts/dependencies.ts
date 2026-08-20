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
import { signal } from '@angular/core';
import { XoObjectClassInterface } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcOptionItem, XoRemappingTableInfoClass, XoSplicingTableInfoClass, XoTableInfo } from '@zeta/xc';
import { Observable, of } from 'rxjs';

import { XoDependency } from './xo/xo-dependency.model';
import { XoGetDependentRTCsRequest } from './xo/xo-get-dependent-rtcs-request.model';
import { XoReferenceDirection } from './xo/xo-reference-direction.model';
import { XoRuntimeContextState, XoRuntimeContextStateEnum } from './xo/xo-runtime-context-state.model';
import { XoRuntimeContext } from './xo/xo-runtime-context.model';


class DependenciesTableInfo extends XoTableInfo {
    protected afterDecode() {
        super.afterDecode();

        this.columns.data.forEach(column => {
            if (column.path === XoDependency.getAccessorMap().runtimeContext.state) {
                column.shrink = true;
            }
            if (column.path === XoDependency.getAccessorMap().runtimeContext.name) {
                column.pre = true;
            }
        });
    }
}


export function createDependenciesTableInput(runtimeContext: XoRuntimeContext, referenceDirection: XoReferenceDirection, includeUnassigned: boolean, includeImplicit: boolean): XoGetDependentRTCsRequest {
    const request = new XoGetDependentRTCsRequest();
    request.runtimeContext = runtimeContext;
    request.includeUnassigned = includeUnassigned;
    request.referenceDirection = referenceDirection;
    request.includeImplicit = includeImplicit;
    return request;
}


export function createDependenciesTableInfoClass(selectable: boolean): XoObjectClassInterface<XoTableInfo> {
    const remappingTableInfoClass = XoRemappingTableInfoClass(
        DependenciesTableInfo,
        XoDependency,
        { src: t => t.runtimeContext.state, dst: t => t.runtimeContext.stateTemplates },
        { src: t => t.runtimeContext.name,  dst: t => t.nameTemplates }
    );
    return (selectable)
        ? XoSplicingTableInfoClass(
            remappingTableInfoClass,
            XoDependency,
            { src: t => t.typeTemplates, items: {disableFilter: true, disableSort: true, idx: 0, shrink: true} }
        )
        : remappingTableInfoClass;
}

export function createFilterEnumOfState(i18n?: I18nService): Observable<XcOptionItem[]> {
    return of([
        { name: signal(''), value: '' },
        ...XoRuntimeContextStateEnum.map(
            state =>
                <XcOptionItem>{
                    name: signal(i18n ? i18n.translate(`xfm.fman.rtcs.state.${state}`) : state),
                    value: state
                    // Icons are not supported because the table uses material icons and the dropdown doesn't yet support that
                    // icon: getStateiconName(state),
                }
        )
    ]);
}

export function getStateiconName(state: string): string {
    if (state === XoRuntimeContextState.WARNING) {
        return 'tb-exception';
    }
    if (state === XoRuntimeContextState.ERROR) {
        return 'tb-exception';
    }
    if (state === XoRuntimeContextState.RUNNING) {
        return 'play_arrow';
    }
    if (state === XoRuntimeContextState.STOPPED) {
        return 'stop';
    }
    return '';
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
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
import { XoArray, XoArrayClass, XoEnumerated, XoObject, XoObjectClass, XoProperty, XoTransient, XoUnique } from '@zeta/api';
import { XcComponentTemplate, XcTemplate } from '@zeta/xc';

import { RuntimeContextIconComponent } from '../shared/runtime-context-icon.component';
import { XoRuntimeContextStateEnum } from './xo-runtime-context-state.model';


@XoObjectClass(null, 'xmcp.factorymanager.rtcmanager', 'RuntimeContext')
export class XoRuntimeContext extends XoObject {

    @XoProperty()
    @XoUnique()
    name: string;

    @XoProperty()
    @XoEnumerated(XoRuntimeContextStateEnum)
    state: string;

    @XoProperty()
    @XoTransient()
    stateTemplates: Array<XcTemplate>;


    afterDecode() {
        this.stateTemplates = [new XcComponentTemplate(RuntimeContextIconComponent, {state: this.state})];
    }


    get label(): string {
        return this.name;
    }


    get title(): string {
        return this.name;
    }
}


@XoArrayClass(XoRuntimeContext)
export class XoRuntimeContextArray extends XoArray<XoRuntimeContext> {
}

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
import { RuntimeContextType, XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty, XoRuntimeContext, XoUnique } from '@zeta/api';

import { XoOrderType } from '../../xo/xo-order-type.model';
import { XoParameterArray } from './xo-parameter.model';
import { XoSourceType } from './xo-source-type.model';
import { isNumber } from '@zeta/base';


@XoObjectClass(null, 'xmcp.factorymanager.orderinputsources', 'OrderInputSource')
export class XoOrderInputSource extends XoObject {


    @XoProperty()
    id: number;


    @XoProperty()
    @XoUnique()
    name: string;


    @XoProperty(XoSourceType)
    sourceType: XoSourceType = new XoSourceType();


    @XoProperty(XoOrderType)
    orderType: XoOrderType = new XoOrderType();


    @XoProperty()
    applicationName: string;


    @XoProperty()
    versionName: string;


    @XoProperty()
    workspaceName: string;


    @XoProperty()
    documentation: string;


    @XoProperty()
    state: string;


    @XoProperty()
    referencedInputSourceCount: number | string;


    @XoProperty(XoParameterArray)
    parameter: XoParameterArray = new XoParameterArray();


    @XoProperty()
    @XoUnique()
    revision: number;


    getXoRuntimeContext(): XoRuntimeContext {
        if (this.workspaceName) {
            return XoRuntimeContext.fromType(RuntimeContextType.Workspace, this.workspaceName, this.revision);
        }
        return XoRuntimeContext.fromType(RuntimeContextType.Application, this.applicationName, this.revision);
    }

    afterDecode() {
        super.afterDecode();

        if (isNumber(this.referencedInputSourceCount) && this.referencedInputSourceCount < 0) {
            this.referencedInputSourceCount = '';
        }
    }

}

@XoArrayClass(XoOrderInputSource)
export class XoOrderInputSourceArray extends XoArray<XoOrderInputSource> {
}

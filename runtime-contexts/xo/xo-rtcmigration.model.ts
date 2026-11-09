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
import { XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty } from '@zeta/api';

import { XoFactoryNode } from './xo-factory-node.model';
import { XoRuntimeContext } from './xo-runtime-context.model';


@XoObjectClass(null, 'xmcp.factorymanager.rtcmanager', 'RTCMigration')
export class XoRTCMigration extends XoObject {
    @XoProperty(XoRuntimeContext)
    source: XoRuntimeContext = new XoRuntimeContext();

    @XoProperty(XoRuntimeContext)
    target: XoRuntimeContext = new XoRuntimeContext();

    @XoProperty(XoFactoryNode)
    factoryNode: XoFactoryNode = new XoFactoryNode();

    constructor(_ident?: string, source?: XoRuntimeContext, target?: XoRuntimeContext, factoryNode?: XoFactoryNode) {
        super(_ident);
        this.source = source;
        this.target = target;
        this.factoryNode = factoryNode;
    }
}

@XoArrayClass(XoRTCMigration)
export class XoRTCMigrationArray extends XoArray<XoRTCMigration> {}

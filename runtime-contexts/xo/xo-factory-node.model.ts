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


@XoObjectClass(null, 'xmcp.factorymanager.rtcmanager', 'FactoryNode')
export class XoFactoryNode extends XoObject {

    static readonly LOCAL = 'local';

    @XoProperty()
    name: string;

    @XoProperty()
    isLocal: boolean;

    constructor(_ident?: string, name?: string, isLocal?: boolean) {
        super(_ident);
        this.name = name;
        this.isLocal = isLocal;
    }
}


@XoArrayClass(XoFactoryNode)
export class XoFactoryNodeArray extends XoArray<XoFactoryNode> {
}
